# Incident Playbook - WhatsApp Executor

## Overview

This playbook documents how to respond to incidents related to the WhatsApp notification executor. It covers common failure scenarios, diagnosis steps, and resolution procedures.

---

## Quick Reference

| Symptom | Likely Cause | First Action |
|---------|--------------|--------------|
| 401 on CRON endpoint | Invalid CRON_SECRET | Check env var in Vercel |
| 409 on CRON endpoint | Concurrent run in progress | Wait 5 min, check logs |
| All messages failing | API key issue or Chatea down | Check Chatea status, API key |
| High 4xx rate | Invalid phone numbers | Check PhoneResolver source |
| High 5xx rate | Chatea API overloaded | Enable rate limiting, reduce limits |
| No messages sent | EXECUTOR_ENABLED=false | Check RolloutConfig |

---

## Incident Severity Levels

### P1 - Critical
- **Definition**: All messages failing, customer impact
- **Response Time**: Immediate (within 15 min)
- **Examples**: Chatea API completely down, all 5xx errors

### P2 - High
- **Definition**: Partial failures, degraded service
- **Response Time**: Within 1 hour
- **Examples**: >20% failure rate, specific carrier failing

### P3 - Medium
- **Definition**: Non-blocking issues, monitoring concerns
- **Response Time**: Within 4 hours
- **Examples**: Success rate dropped below threshold, increased latency

### P4 - Low
- **Definition**: Minor issues, improvements needed
- **Response Time**: Within 24 hours
- **Examples**: Log verbosity issues, documentation gaps

---

## Incident Response Procedures

### 1. CRON Job Not Running

**Symptoms:**
- No new runs in ExecutorRunLog
- Admin endpoint shows old lastRunAt

**Diagnosis:**
```bash
# Check Vercel CRON logs
vercel logs --since 1h | grep cron

# Check admin status
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/admin/executor-status
```

**Resolution:**
1. Verify vercel.json has cron configuration
2. Check CRON_SECRET is set in Vercel
3. Manual trigger: `POST /api/cron/run-executor` with auth header
4. If stuck, redeploy to clear serverless state

---

### 2. High Failure Rate (>10%)

**Symptoms:**
- metrics24h.failed4xx or failed5xx increasing
- successRate < 90%

**Diagnosis:**
```bash
# Get 24h metrics
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/admin/executor-status | jq '.metrics24h'
```

**Resolution for 4xx errors:**
1. Check PhoneResolver is returning valid phones
2. Verify phone format matches Chatea requirements (+57...)
3. Check if specific carriers have format issues

**Resolution for 5xx errors:**
1. Check Chatea API status
2. Reduce RATE_LIMIT_PER_MINUTE
3. Enable circuit breaker if not already
4. Contact Chatea support if persistent

---

### 3. Rate Limit Exhausted

**Symptoms:**
- Many skippedRateLimit in metrics
- Messages queuing but not sending

**Diagnosis:**
```bash
# Check rate limiter stats
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/admin/executor-status | jq '.stats.rateLimiter'
```

**Resolution:**
1. Wait for rate limit window to reset (end of day)
2. Increase DAILY_SEND_LIMIT if appropriate
3. Check for duplicate message attempts
4. Verify idempotency is working correctly

---

### 4. Memory/Performance Issues (Serverless)

**Symptoms:**
- Function timeouts (>10s)
- Memory warnings in logs

**Diagnosis:**
```bash
# Check function duration
vercel logs --since 1h | grep "Duration:"
```

**Resolution:**
1. Reduce batch size in executor
2. Check for memory leaks in PhoneResolver
3. Clear any in-memory caches
4. Consider pagination for large action sets

---

### 5. Duplicate Messages Sent

**Symptoms:**
- Users receiving same message multiple times
- skippedDuplicate should be catching these

**Diagnosis:**
1. Check idempotency key format in ActionLogService
2. Verify idempotency is checked before send
3. Check for ActionLog storage issues

**Resolution:**
1. Immediate: EXECUTOR_ENABLED=false to stop sending
2. Investigate idempotency key collisions
3. Check if ActionLog is persisting across requests
4. Review recent code changes to idempotency logic

---

### 6. PII Leak Detected

**Symptoms:**
- Phone numbers appearing in logs
- User data in error messages

**Immediate Actions:**
1. EXECUTOR_ENABLED=false immediately
2. Rotate any exposed secrets/keys
3. Delete affected logs
4. Notify security team

**Root Cause Analysis:**
1. Check all log statements for PII
2. Review error message sanitization
3. Verify PhoneResolver never logs phones
4. Check ExecutorRunLog sanitizeMetadata

---

## Rollback Procedures

### Quick Disable
```bash
# Via Vercel Dashboard:
# Set EXECUTOR_ENABLED=false

# Or via CLI:
vercel env add EXECUTOR_ENABLED false
vercel --prod
```

### Rollback to Previous Version
```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

### Emergency: Delete CRON Job
```json
// Remove from vercel.json and redeploy
{
  "crons": []
}
```

---

## Monitoring Checklist

### Daily Review
- [ ] Check 24h metrics (success rate > 90%)
- [ ] Review failed4xx and failed5xx counts
- [ ] Verify CRON jobs ran on schedule
- [ ] Compare today vs yesterday metrics

### Weekly Review
- [ ] Analyze top failure reasons
- [ ] Review rate limit utilization
- [ ] Check for any PII in logs
- [ ] Update playbook with new learnings

---

## Contacts

| Role | Contact | When to Notify |
|------|---------|----------------|
| On-call | [TBD] | P1, P2 incidents |
| Chatea Support | [TBD] | API issues |
| Security | [TBD] | PII leaks |

---

## Environment Variables Reference

| Variable | Purpose | Default |
|----------|---------|---------|
| EXECUTOR_ENABLED | Enable message sending | false |
| PILOT_CITY | Restrict to one city | null |
| PILOT_CARRIER | Restrict to one carrier | null |
| DAILY_SEND_LIMIT | Max messages per day | 100 |
| RATE_LIMIT_PER_MINUTE | Max per minute | 20 |
| CRON_SECRET | Auth for CRON endpoint | required |
| CHATEA_API_KEY | Chatea authentication | required |
| CHATEA_DEVICE_ID | Chatea device identifier | required |

---

## Appendix: Useful Commands

```bash
# Get current rollout config
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/admin/rollout-config

# Get executor status and 24h metrics
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/admin/executor-status

# Manually trigger executor (dry-run if EXECUTOR_ENABLED=false)
curl -X POST -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/run-executor

# Check Vercel logs
vercel logs --since 1h
```

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2024-12-29 | System | Initial playbook creation |
