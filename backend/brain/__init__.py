"""
Litper Pro - Autonomous Brain System
Sistema de cerebro autónomo potenciado por Claude AI.
"""

from .core.brain_engine import ClaudeAutonomousBrain
from .claude.client import ClaudeBrainClient, ClaudeConfig, ClaudeModel

__all__ = [
    'ClaudeAutonomousBrain',
    'ClaudeBrainClient',
    'ClaudeConfig',
    'ClaudeModel'
]

__version__ = '1.0.0'
