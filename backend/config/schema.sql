-- ============================================================
-- Centralized IPR and Project Management Platform
-- MySQL Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS ipr_platform;
USE ipr_platform;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('researcher', 'investor', 'ipr_professional', 'admin') DEFAULT 'researcher',
    organization VARCHAR(150),
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    technology_domain VARCHAR(100),
    funding_required DECIMAL(15, 2) DEFAULT 0,
    funding_received DECIMAL(15, 2) DEFAULT 0,
    status ENUM('draft', 'active', 'under_review', 'approved', 'rejected', 'completed') DEFAULT 'draft',
    progress INT DEFAULT 0,
    start_date DATE,
    expected_end_date DATE,
    lead_researcher_id INT,
    institution VARCHAR(200),
    keywords TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_researcher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Project Team Members
CREATE TABLE IF NOT EXISTS project_team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role_in_project VARCHAR(100),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- IPR Records Table
CREATE TABLE IF NOT EXISTS ipr_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    ipr_type ENUM('patent', 'copyright', 'trademark', 'trade_secret', 'design') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    filing_number VARCHAR(100),
    status ENUM('draft', 'filed', 'under_review', 'approved', 'rejected', 'expired') DEFAULT 'draft',
    filing_date DATE,
    approval_date DATE,
    expiry_date DATE,
    jurisdiction VARCHAR(100) DEFAULT 'India',
    applicant_name VARCHAR(200),
    attorney_name VARCHAR(200),
    document_path VARCHAR(500),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Investments Table
CREATE TABLE IF NOT EXISTS investments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    investor_id INT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    equity_percentage DECIMAL(5, 2),
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    investment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (investor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_type VARCHAR(50),
    related_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Project Documents
CREATE TABLE IF NOT EXISTS project_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    uploaded_by INT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INT,
    description VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- Seed Data
-- ============================================================

-- Admin user (password: Admin@123)
INSERT INTO users (full_name, email, password, role, organization) VALUES
('Admin User', 'admin@iprplatform.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'IPR Platform'),
('Dr. Priya Sharma', 'priya@research.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'researcher', 'IIT Nagpur'),
('Raj Mehta', 'raj@ventures.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'investor', 'Mehta Ventures'),
('Adv. Sunita Patel', 'sunita@iprlaw.in', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ipr_professional', 'IPR Law Associates');

-- Sample Projects
INSERT INTO projects (title, description, technology_domain, funding_required, funding_received, status, progress, start_date, expected_end_date, lead_researcher_id, institution, keywords, is_public) VALUES
('AI-Powered Drug Discovery Platform', 'Using machine learning to accelerate drug discovery for tropical diseases prevalent in South Asia.', 'Biotechnology / AI', 5000000, 2000000, 'active', 65, '2024-01-15', '2025-06-30', 2, 'IIT Nagpur', 'AI, Drug Discovery, ML, Healthcare', TRUE),
('Solar-Powered Water Purification System', 'Developing a low-cost, solar-powered water purification system for rural communities.', 'Clean Energy / Water Tech', 1500000, 750000, 'approved', 80, '2023-09-01', '2025-03-31', 2, 'IIT Nagpur', 'Solar, Water, Rural, Sustainability', TRUE),
('Blockchain-Based Land Registry', 'Implementing blockchain for tamper-proof land registry system for Indian municipalities.', 'Blockchain / GovTech', 2000000, 500000, 'under_review', 40, '2024-03-01', '2025-12-31', 2, 'IIT Nagpur', 'Blockchain, Land Registry, GovTech', TRUE);

-- Sample IPR Records
INSERT INTO ipr_records (project_id, ipr_type, title, description, filing_number, status, filing_date, jurisdiction, applicant_name, created_by) VALUES
(1, 'patent', 'ML Algorithm for Protein Folding Analysis', 'Novel machine learning approach for analyzing protein structures in drug discovery.', 'IN202411012345', 'under_review', '2024-02-20', 'India', 'IIT Nagpur', 2),
(2, 'patent', 'Solar Nano-Filtration Membrane', 'Advanced nano-filtration membrane for solar-powered water purification.', 'IN202410098765', 'approved', '2023-10-15', 'India', 'IIT Nagpur', 2),
(3, 'copyright', 'Blockchain Registry Software v1.0', 'Source code and architecture for the blockchain-based land registry system.', 'CR/2024/001234', 'filed', '2024-03-20', 'India', 'IIT Nagpur', 2);

-- Sample Notifications
INSERT INTO notifications (user_id, title, message, type, related_type, related_id) VALUES
(2, 'IPR Status Update', 'Your patent application IN202411012345 is now Under Review.', 'info', 'ipr', 1),
(2, 'Project Approved', 'Solar-Powered Water Purification System has been approved by the review committee.', 'success', 'project', 2),
(3, 'New Investment Opportunity', 'A new research project matching your interests is available for investment.', 'info', 'project', 1);
