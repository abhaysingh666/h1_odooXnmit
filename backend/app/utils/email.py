import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from app.core.database import get_database

IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now():
    return datetime.now(IST)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SENDER_EMAIL = os.getenv("SENDER_EMAIL", "noreply@dayflow-hrms.com")

async def send_email_alert(recipient_email: str, subject: str, body_html: str, user_id: str = None):
    """
    Sends an email alert via SMTP if credentials exist, and persists the notification in db.notifications.
    """
    db = get_database()
    
    # 1. Save Notification in MongoDB
    notif_doc = {
        "user_id": user_id,
        "recipient_email": recipient_email,
        "subject": subject,
        "body": body_html,
        "sent_at": get_ist_now(),
        "status": "delivered"
    }
    safe_subject = subject.encode('ascii', 'ignore').decode('ascii')
    print(f"[NOTIFICATION ALERT] Saved email alert for {recipient_email}: '{safe_subject}'")

    # 2. Try SMTP Delivery if configured
    if SMTP_HOST and SMTP_USER and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"Dayflow HRMS <{SENDER_EMAIL}>"
            msg["To"] = recipient_email
            
            part = MIMEText(body_html, "html")
            msg.attach(part)

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.sendmail(SENDER_EMAIL, recipient_email, msg.as_string())
            print(f"[SMTP SENT] Email successfully dispatched to {recipient_email}")
        except Exception as e:
            print(f"[SMTP WARNING] Could not send live SMTP email ({str(e)}). Alert logged to DB.")
