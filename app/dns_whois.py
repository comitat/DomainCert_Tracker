import dns.resolver
import whois
import time
import logging
from functools import lru_cache

logging.basicConfig(level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def get_dns_info(domain):
    try:
        dns_records = {}
        resolver = dns.resolver.Resolver()
        resolver.nameservers = ['8.8.8.8', '1.1.1.1', '208.67.222.222']
        resolver.lifetime = 10
        resolver.timeout = 5 

        for record_type in ['A', 'AAAA', 'MX', 'NS', 'TXT']:
            for attempt in range(3): 
                try:
                    answers = resolver.resolve(domain, record_type)
                    dns_records[record_type] = [rdata.to_text() for rdata in answers]
                    break
                except dns.resolver.NoAnswer:
                    dns_records[record_type] = []
                    break
                except dns.resolver.NXDOMAIN:
                    logger.error(f"Domain {domain} does not exist.")
                    return {"error": f"Domain {domain} does not exist."}
                except dns.resolver.Timeout:
                    if attempt < 2:
                        time.sleep(2) 
                        continue
                    else:
                        logger.error(f"DNS query timed out for {domain}.")
                        return {"error": f"DNS query timed out for {domain}."}
        return dns_records
    except Exception as e:
        logger.error(f"Error retrieving DNS info for domain {domain}: {str(e)}")
        return {"error": str(e)}

@lru_cache(maxsize=100)
def get_dns_info_cached(domain):
    return get_dns_info(domain)

def get_whois_info(domain, retries=5, delay=5):
    for attempt in range(retries):
        try:
            w = whois.whois(domain)
            logger.debug(f"WHOIS response for {domain}: {w}")
            if not w:
                return {"error": f"No WHOIS data found for {domain}"}
            
            domain_name = w.domain_name
            if isinstance(domain_name, list):
                domain_name = domain_name[0] if domain_name else "N/A"
            
            creation_date = w.creation_date
            if isinstance(creation_date, list):
                creation_date = creation_date[0] if creation_date else "N/A"
            
            expiration_date = w.expiration_date
            if isinstance(expiration_date, list):
                expiration_date = expiration_date[0] if expiration_date else "N/A"
            
            name_servers = w.name_servers
            if isinstance(name_servers, list):
                name_servers = list(name_servers)
            else:
                name_servers = [name_servers] if name_servers else []
            
            return {
                "domain_name": domain_name,
                "registrar": w.registrar,
                "creation_date": creation_date,
                "expiration_date": expiration_date,
                "name_servers": name_servers,
            }
        except Exception as e:
            logger.error(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt < retries - 1:
                time.sleep(delay)
                continue
            else:
                return {"error": str(e)}