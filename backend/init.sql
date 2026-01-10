CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,
    service VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_service ON system_logs(service);
CREATE INDEX idx_created_at ON system_logs(created_at);


