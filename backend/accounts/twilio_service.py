import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class TwilioService:
    @staticmethod
    def send_verification_otp(phone_number: str) -> dict:
        """
        Sends verification OTP via Twilio Verify API.
        If OTP_DEV_MODE is True, bypasses Twilio and simulates success.
        """
        if getattr(settings, 'OTP_DEV_MODE', False):
            logger.info(f"[DEV MODE] Simulating OTP send to {phone_number}. Fixed OTP is 123456.")
            return {
                "success": True,
                "status": "pending",
                "message": "Dev Mode: Verification OTP sent. Use 123456.",
                "dev_otp": "123456"
            }

        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            verification = client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID) \
                .verifications \
                .create(to=phone_number, channel='sms')
            return {
                "success": True,
                "status": verification.status,
                "message": "OTP sent successfully to your mobile number via SMS."
            }
        except Exception as e:
            logger.error(f"Twilio Verify send error for {phone_number}: {e}")
            return {
                "success": False,
                "status": "failed",
                "message": f"Failed to send SMS OTP: {str(e)}"
            }

    @staticmethod
    def check_verification_otp(phone_number: str, code: str) -> dict:
        """
        Verifies the OTP code.
        If OTP_DEV_MODE is True, accepts '123456'.
        """
        if getattr(settings, 'OTP_DEV_MODE', False):
            if code.strip() == "123456":
                return {
                    "success": True,
                    "status": "approved",
                    "message": "Dev Mode: OTP approved."
                }
            return {
                "success": False,
                "status": "denied",
                "message": "Invalid OTP. In Dev Mode, please use 123456."
            }

        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            verification_check = client.verify.v2.services(settings.TWILIO_VERIFY_SERVICE_SID) \
                .verification_checks \
                .create(to=phone_number, code=code)
            
            if verification_check.status == 'approved':
                return {
                    "success": True,
                    "status": "approved",
                    "message": "Phone number verified successfully."
                }
            else:
                return {
                    "success": False,
                    "status": verification_check.status,
                    "message": "Incorrect or expired OTP. Please try again."
                }
        except Exception as e:
            logger.error(f"Twilio Verify check error for {phone_number}: {e}")
            return {
                "success": False,
                "status": "error",
                "message": f"Verification error: {str(e)}"
            }
