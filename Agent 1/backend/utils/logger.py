import logging
import os
from logging.handlers import RotatingFileHandler
from config.settings import settings

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(settings.LOG_LEVEL)
        
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)
        
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        fh = RotatingFileHandler(f"{log_dir}/fluxcore.log", maxBytes=5_000_000, backupCount=5)
        fh.setFormatter(formatter)
        logger.addHandler(fh)
        
    return logger
