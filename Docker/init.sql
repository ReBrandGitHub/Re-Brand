CREATE USER dev;
alter user dev with password 'postgres'
CREATE DATABASE nft-marketplace;
GRANT ALL PRIVILEGES ON DATABASE nft-marketplace TO dev;
