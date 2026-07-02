"""
Hermes — ProCare AI Hub
setuptools package configuration.
"""

from setuptools import setup, find_packages
from pathlib import Path

long_description = (Path(__file__).parent / "README.md").read_text(encoding="utf-8")

setup(
    name="hermes-procare",
    version="0.1.0",
    description="AI messaging hub, ProCare Pharmacy ops, and personal task runner.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="ProCare Pharmacies",
    author_email="procarepharmacies@gmail.com",
    license="MIT",
    python_requires=">=3.11",
    packages=find_packages(exclude=["desktop*", "scripts*", "tests*"]),
    install_requires=[
        "typer[all]>=0.12",
        "rich>=13.0",
        "anthropic>=0.30",
        "httpx>=0.27",
        "pydantic>=2.0",
        "pydantic-settings>=2.0",
        "aiosqlite>=0.20",
        "python-dotenv>=1.0",
    ],
    extras_require={
        "dev": [
            "pytest>=8.0",
            "pytest-asyncio>=0.23",
        ]
    },
    entry_points={
        "console_scripts": [
            "hermes=hermes.cli.app:app",
        ],
    },
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Healthcare Industry",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
