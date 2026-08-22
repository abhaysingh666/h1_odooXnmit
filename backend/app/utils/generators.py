import secrets
import string
from datetime import datetime
import re


def generate_login_id(company_name: str, employee_name: str, year: int, serial_number: int) -> str:
    """
    Generate login ID in format: CINNNNYYYYSSSS
    
    - CI = Company Initial (first 2 letters of company name, uppercase)
    - NNNN = First two letters of first name + First two letters of last name (uppercase)
    - YYYY = Year of joining (4 digits)
    - SSSS = Serial number (4 digits, padded with zeros)
    
    Example: OI20202022001
    - OI = Odoo India (Company)
    - 2020 = Jo + hn (First + Last name)
    - 2022 = Year
    - 0001 = Serial number
    
    Args:
        company_name: Name of the company
        employee_name: Full name of the employee
        year: Year of joining
        serial_number: Serial number for that year
    
    Returns:
        Generated login ID string
    """
    # Extract first 2 letters of company name, remove spaces
    company_initial = ''.join(company_name.split())[:2].upper()
    
    # If company name is only 1 character, pad with 'X'
    if len(company_initial) == 1:
        company_initial += 'X'
    
    # Extract name letters (first 2 of first name + first 2 of last name)
    name_parts = employee_name.strip().split()
    
    if len(name_parts) >= 2:
        # Has first and last name
        first_name = name_parts[0]
        last_name = name_parts[-1]  # Take last part as last name
        
        # Get first 2 letters of each
        first_letters = first_name[:2].upper()
        last_letters = last_name[:2].upper()
        
        # Pad if needed
        first_letters = first_letters.ljust(2, 'X')
        last_letters = last_letters.ljust(2, 'X')
        
        name_code = first_letters + last_letters
    else:
        # Only one name provided
        single_name = name_parts[0] if name_parts else "XXXX"
        # Take first 4 letters or pad with X
        name_code = single_name[:4].upper().ljust(4, 'X')
    
    # Format: CINNNNYYYYSSSS
    login_id = f"{company_initial}{name_code}{year:04d}{serial_number:04d}"
    
    return login_id


def generate_random_password(length: int = 12) -> str:
    """
    Generate a random secure password for first-time users.
    
    Password will contain:
    - Uppercase letters
    - Lowercase letters
    - Digits
    - Special characters
    
    Args:
        length: Length of password (default 12)
    
    Returns:
        Generated password string
    """
    # Character sets
    uppercase = string.ascii_uppercase
    lowercase = string.ascii_lowercase
    digits = string.digits
    special = "!@#$%^&*"
    
    # Ensure at least one of each type
    password = [
        secrets.choice(uppercase),
        secrets.choice(lowercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]
    
    # Fill the rest randomly
    all_chars = uppercase + lowercase + digits + special
    password += [secrets.choice(all_chars) for _ in range(length - 4)]
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)


async def get_next_serial_number(db, year: int) -> int:
    """
    Get the next serial number for a given year.
    
    Serial numbers are 4 digits (0001-9999).
    
    Args:
        db: Database instance
        year: Year to get serial number for
    
    Returns:
        Next available serial number
    """
    # Count users created in this year
    count = await db.users.count_documents({
        "created_at": {
            "$gte": datetime(year, 1, 1),
            "$lt": datetime(year + 1, 1, 1)
        }
    })
    
    next_serial = count + 1
    
    # Check if we exceeded 4-digit limit (9999)
    if next_serial > 9999:
        raise Exception(f"Serial number limit exceeded for year {year}. Maximum 9999 users per year.")
    
    return next_serial
