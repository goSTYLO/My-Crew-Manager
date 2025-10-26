#!/usr/bin/env python3
"""
Dependency Check Script for My Crew Manager
Checks all required dependencies for the project
"""

import subprocess
import sys
import importlib
import json
import os

def run_command(command, shell=True):
    """Run a command and return the result"""
    try:
        result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return False, "", str(e)

def check_python_package(package_name, import_name=None):
    """Check if a Python package is installed"""
    if import_name is None:
        import_name = package_name
    
    try:
        module = importlib.import_module(import_name)
        version = getattr(module, '__version__', 'Unknown')
        return True, version
    except ImportError:
        return False, None

def check_node_package(package_name, directory="web"):
    """Check if a Node.js package is installed"""
    try:
        package_json_path = os.path.join(directory, "package.json")
        if not os.path.exists(package_json_path):
            return False, "package.json not found"
        
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        dependencies = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
        
        if package_name in dependencies:
            return True, dependencies[package_name]
        else:
            return False, "Not in package.json"
    except Exception as e:
        return False, str(e)

def main():
    print("🔍 My Crew Manager - Dependency Check")
    print("=" * 50)
    
    # Check Python version
    print("\n📋 Python Environment:")
    success, stdout, stderr = run_command("python --version")
    if success:
        print(f"✅ Python: {stdout}")
    else:
        print(f"❌ Python: {stderr}")
    
    success, stdout, stderr = run_command("pip --version")
    if success:
        print(f"✅ pip: {stdout}")
    else:
        print(f"❌ pip: {stderr}")
    
    # Check Node.js
    print("\n📋 Node.js Environment:")
    success, stdout, stderr = run_command("node --version")
    if success:
        print(f"✅ Node.js: {stdout}")
    else:
        print(f"❌ Node.js: {stderr}")
    
    success, stdout, stderr = run_command("npm --version")
    if success:
        print(f"✅ npm: {stdout}")
    else:
        print(f"❌ npm: {stderr}")
    
    # Check Python packages
    print("\n📋 Python Dependencies:")
    python_packages = [
        ("Django", "django"),
        ("Django REST Framework", "rest_framework"),
        ("Django Channels", "channels"),
        ("PostgreSQL", "psycopg2"),
        ("JWT", "rest_framework_simplejwt"),
        ("CORS Headers", "corsheaders"),
        ("Decouple", "decouple"),
        ("Dotenv", "dotenv"),
        ("Transformers", "transformers"),
        ("LangChain", "langchain"),
        ("Datasets", "datasets"),
        ("PEFT", "peft"),
        ("PDF Plumber", "pdfplumber"),
        ("Pillow", "PIL"),
        ("PyTorch", "torch"),
    ]
    
    for display_name, import_name in python_packages:
        installed, version = check_python_package(display_name, import_name)
        if installed:
            print(f"✅ {display_name}: {version}")
        else:
            print(f"❌ {display_name}: Not installed")
    
    # Check Node.js packages
    print("\n📋 Node.js Dependencies:")
    node_packages = [
        "react",
        "react-dom",
        "react-router-dom",
        "chart.js",
        "framer-motion",
        "lucide-react",
        "vite",
        "typescript",
        "tailwindcss"
    ]
    
    for package in node_packages:
        installed, version = check_node_package(package)
        if installed:
            print(f"✅ {package}: {version}")
        else:
            print(f"❌ {package}: {version}")
    
    # Check database
    print("\n📋 Database:")
    success, stdout, stderr = run_command('python -c "import sqlite3; print(\'SQLite version:\', sqlite3.sqlite_version)"')
    if success:
        print(f"✅ SQLite: {stdout}")
    else:
        print(f"❌ SQLite: {stderr}")
    
    # Check Redis
    print("\n📋 Redis (for WebSocket channels):")
    # Try system redis-cli first
    success, stdout, stderr = run_command("redis-cli ping")
    if success:
        print(f"✅ Redis: {stdout}")
    else:
        # Try local redis installation
        success, stdout, stderr = run_command(".\\redis\\redis-cli.exe ping")
        if success:
            print(f"✅ Redis: {stdout} (local installation)")
        else:
            print("⚠️ Redis: Not running (using in-memory channels)")
    
    # Check CUDA
    print("\n📋 CUDA (for AI features):")
    try:
        import torch
        cuda_available = torch.cuda.is_available()
        if cuda_available:
            print(f"✅ CUDA: Available (PyTorch {torch.__version__})")
        else:
            print(f"⚠️ CUDA: Not available (PyTorch {torch.__version__})")
    except ImportError:
        print("❌ PyTorch: Not installed")
    
    # Check project structure
    print("\n📋 Project Structure:")
    required_files = [
        "manage.py",
        "requirements.txt",
        "web/package.json",
        "my_crew_manager/settings.py",
        "ai_api/models.py",
        "ai_api/consumers.py"
    ]
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path}")
    
    print("\n" + "=" * 50)
    print("🎯 Summary:")
    print("- If you see ❌ for any dependencies, install them using:")
    print("  pip install -r requirements.txt")
    print("  cd web && npm install")
    print("- If Redis is not available, the app will use in-memory channels")
    print("- If CUDA is not available, AI features will use CPU")

if __name__ == "__main__":
    main()
