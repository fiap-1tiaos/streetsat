import json
import os
import re
from datetime import datetime
from typing import Optional

import boto3
from fastapi import APIRouter, HTTPException, Query

from src.utils.logger import get_logger

log = get_logger(__name__)
router = APIRouter(prefix="/pipeline", tags=["pipeline"])

AWS_ENDPOINT_URL = os.environ.get("AWS_ENDPOINT_URL")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
S3_BUCKET = os.environ.get("S3_BUCKET", "streetsat-models-dev")
INFERENCE_QUEUE_URL = os.environ.get("SQS_INFERENCE_QUEUE_URL", "")
ALERTS_QUEUE_URL = os.environ.get("SQS_ALERTS_QUEUE_URL", "")
SNS_TOPIC_ARN = os.environ.get("SNS_TOPIC_ARN", "")

LAMBDA_SCRAPER = os.environ.get("LAMBDA_SCRAPER_NAME", "streetsat-dev-scraper")
LOG_GROUPS = [
    ("scraper", "/aws/lambda/streetsat-dev-scraper"),
    ("inference", "/aws/lambda/streetsat-dev-inference"),
    ("alerter", "/aws/lambda/streetsat-dev-alerter"),
]


def _aws_kwargs():
    kwargs = {"region_name": AWS_REGION}
    if AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = AWS_ENDPOINT_URL
    return kwargs


def _logs_client():
    return boto3.client("logs", **_aws_kwargs())


def _lambda_last_run(source: str, log_group: str) -> dict:
    logs_client = _logs_client()
    try:
        streams = logs_client.describe_log_streams(
            logGroupName=log_group,
            orderBy="LastEventTime",
            descending=True,
            limit=1,
        )
        streams_list = streams.get("logStreams", [])
        if not streams_list:
            return {"status": "idle", "last_run": None, "occurrences_count": 0, "alerts_generated": 0, "published_count": 0, "elapsed_seconds": 0, "error": None}

        stream = streams_list[0]
        last_event_ts = stream["lastEventTimestamp"]
        events = logs_client.get_log_events(
            logGroupName=log_group,
            logStreamName=stream["logStreamName"],
            limit=30,
        )

        ev_list = events.get("events", [])
        if not ev_list:
            return {"status": "idle", "last_run": None, "occurrences_count": 0, "alerts_generated": 0, "published_count": 0, "elapsed_seconds": 0, "error": None}

        newest_msg = ev_list[-1].get("message", "")
        last_run = datetime.fromtimestamp(last_event_ts / 1000).isoformat()

        # Collect data from all events
        has_error = False
        error_msg = None
        occurrences = 0
        alerts_gen = 0
        published = 0
        elapsed = 0
        has_report = False

        for event in ev_list:
            msg = event.get("message", "")
            if "[ERROR]" in msg:
                has_error = True
                error_msg = msg
            if msg.startswith("REPORT "):
                has_report = True
                m = re.search(r"Duration:\s*([\d.]+)\s*ms", msg)
                if m:
                    elapsed = int(float(m.group(1)))
            m = re.search(r"(\d+)\s*ocorrências?\s*(coletadas|processadas)?", msg)
            if m:
                occurrences = int(m.group(1))
            m = re.search(r"(\d+)\s*alertas?\s*gerados?", msg)
            if m:
                alerts_gen = int(m.group(1))
            m = re.search(r"(\d+)\s*publicados?", msg)
            if m:
                published = int(m.group(1))

        # Determine status
        is_running = newest_msg.startswith("START") and not has_report
        if is_running:
            status = "running"
        elif has_error:
            status = "failed"
        elif has_report:
            status = "success"
        else:
            status = "idle"

        result = {"status": status, "last_run": last_run, "elapsed_seconds": elapsed, "error": error_msg}
        if source == "scraper":
            result["occurrences_count"] = occurrences
        elif source == "inference":
            result["alerts_generated"] = alerts_gen
        elif source == "alerter":
            result["published_count"] = published
        return result
    except Exception as e:
        log.warning("CloudWatch logs unavailable for %s: %s", log_group, e)
        return {"status": "offline", "last_run": None, "occurrences_count": 0, "alerts_generated": 0, "published_count": 0, "elapsed_seconds": 0, "error": str(e)}


@router.get("/status")
async def pipeline_status():
    sqs = boto3.client("sqs", **_aws_kwargs())
    s3 = boto3.client("s3", **_aws_kwargs())
    sns = boto3.client("sns", **_aws_kwargs()) if SNS_TOPIC_ARN else None

    inference_queue = _queue_info(sqs, INFERENCE_QUEUE_URL)
    alerts_queue = _queue_info(sqs, ALERTS_QUEUE_URL)
    s3_raw_count = _s3_object_count(s3)

    sns_subscriptions = 0
    if sns:
        try:
            subs = sns.list_subscriptions_by_topic(TopicArn=SNS_TOPIC_ARN)
            sns_subscriptions = len(subs.get("Subscriptions", []))
        except Exception:
            pass

    last_scrape = _lambda_last_run("scraper", LOG_GROUPS[0][1])
    last_inference = _lambda_last_run("inference", LOG_GROUPS[1][1])
    last_alert_publish = _lambda_last_run("alerter", LOG_GROUPS[2][1])

    return {
        "last_scrape": last_scrape,
        "inference_queue": inference_queue,
        "last_inference": last_inference,
        "alerts_queue": alerts_queue,
        "last_alert_publish": last_alert_publish,
        "sns_topic": {"topic_arn": SNS_TOPIC_ARN, "active_subscriptions": sns_subscriptions},
        "s3_raw_count": s3_raw_count,
        "alert_history_24h": 0,
    }


@router.post("/trigger/scraper")
async def trigger_scraper():
    lambda_ = boto3.client("lambda", **_aws_kwargs())
    try:
        resp = lambda_.invoke(
            FunctionName=LAMBDA_SCRAPER,
            InvocationType="Event",
            Payload=json.dumps({"source": "manual", "triggered_at": datetime.now().isoformat()}),
        )
        status = resp.get("StatusCode", 0)
        log.info("Scraper Lambda invocada manualmente: status=%d", status)
        return {"status": "invoked", "function": LAMBDA_SCRAPER, "status_code": status}
    except Exception as e:
        log.error("Falha ao invocar scraper Lambda: %s", e)
        raise HTTPException(status_code=502, detail=str(e))


@router.get("/logs")
async def pipeline_logs(
    source: Optional[str] = Query(None),
    limit: int = Query(default=50, le=200),
):
    logs_client = _logs_client()
    all_events: list[dict] = []

    groups = LOG_GROUPS if not source else [g for g in LOG_GROUPS if g[0] == source]

    for src_name, log_group in groups:
        try:
            streams = logs_client.describe_log_streams(
                logGroupName=log_group,
                orderBy="LastEventTime",
                descending=True,
                limit=2,
            )
            for stream in streams.get("logStreams", [])[:2]:
                resp = logs_client.get_log_events(
                    logGroupName=log_group,
                    logStreamName=stream["logStreamName"],
                    limit=limit // len(groups),
                )
                for ev in resp.get("events", []):
                    all_events.append({
                        "timestamp": datetime.fromtimestamp(ev["timestamp"] / 1000).isoformat(),
                        "source": src_name,
                        "level": "ERROR" if "[ERROR]" in ev["message"] else ("WARNING" if "[WARN]" in ev["message"] else "INFO"),
                        "message": ev["message"].strip(),
                    })
        except Exception as e:
            log.warning("Logs unavailable for %s: %s", log_group, e)

    all_events.sort(key=lambda e: e["timestamp"], reverse=True)
    return {"total": len(all_events), "items": all_events[:limit]}


def _queue_info(sqs, queue_url: str) -> dict:
    if not queue_url:
        return {"queue_url": "", "messages_available": 0, "messages_in_flight": 0, "approximate_age_seconds": 0}
    try:
        attrs = sqs.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=["ApproximateNumberOfMessages", "ApproximateNumberOfMessagesNotVisible", "ApproximateAgeOfOldestMessage"],
        )
        attrs = attrs.get("Attributes", {})
        return {
            "queue_url": queue_url,
            "messages_available": int(attrs.get("ApproximateNumberOfMessages", 0)),
            "messages_in_flight": int(attrs.get("ApproximateNumberOfMessagesNotVisible", 0)),
            "approximate_age_seconds": int(attrs.get("ApproximateAgeOfOldestMessage", 0)),
        }
    except Exception as e:
        log.warning("SQS status unavailable: %s", e)
        return {"queue_url": queue_url, "messages_available": -1, "messages_in_flight": -1, "approximate_age_seconds": 0}


def _s3_object_count(s3) -> int:
    try:
        resp = s3.list_objects_v2(Bucket=S3_BUCKET, Prefix="raw/occurrences/", MaxKeys=1000)
        return resp.get("KeyCount", 0)
    except Exception:
        return 0
