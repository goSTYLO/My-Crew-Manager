# Django Server Commands

## Local Development (localhost only)
```bash
python manage.py runserver
```
Access at: http://localhost:8000/admin/

## Network Access (all devices on network)
```bash
python manage.py runserver 0.0.0.0:8000
```
Access at: http://YOUR_DEVICE_IP:8000/admin/

## Quick Start with Environment Variables
1. Update `.env` in project root with your device IP
2. Run: `python manage.py runserver 0.0.0.0:8000`
3. Run: `python scripts/sync_mobile_config.py` (to update mobile)
4. All components now use the same IP

## Notes
- Database (PostgreSQL) always runs locally, no network config needed
- Web app automatically uses IP from .env
- Mobile app needs sync script run after .env changes
