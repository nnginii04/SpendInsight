-- ============================================================
-- 금융 소비 패턴 분석 웹 시스템 — MySQL DDL
-- 요구사항 정의서(FR-04~FR-16) · 클래스 다이어그램 기반
-- ============================================================

-- DROP DATABASE IF EXISTS geumso_pae;
-- CREATE DATABASE geumso_pae
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;
USE railway;

-- ------------------------------------------------------------
-- 기준 코드 테이블 (FR-15)
-- ------------------------------------------------------------

CREATE TABLE sex_code (
  sex_code   CHAR(1)      NOT NULL,
  sex_name   VARCHAR(10)  NOT NULL,
  PRIMARY KEY (sex_code)
) ENGINE=InnoDB;

CREATE TABLE age_group (
  age_code   CHAR(2)      NOT NULL,
  age_range  VARCHAR(20)  NOT NULL COMMENT '연령 구간 표시 (예: 20-29)',
  PRIMARY KEY (age_code)
) ENGINE=InnoDB;

CREATE TABLE day_of_week (
  day_code   CHAR(1)      NOT NULL,
  day_name   VARCHAR(10)  NOT NULL,
  PRIMARY KEY (day_code)
) ENGINE=InnoDB;

CREATE TABLE hour_band (
  hour_code   CHAR(2)     NOT NULL,
  hour_range  VARCHAR(30) NOT NULL COMMENT '시간대 구간 (예: 12-17시)',
  hour_start  TINYINT     NOT NULL,
  hour_end    TINYINT     NOT NULL,
  PRIMARY KEY (hour_code),
  CONSTRAINT chk_hour_range CHECK (hour_start >= 0 AND hour_end <= 23 AND hour_start <= hour_end)
) ENGINE=InnoDB;

CREATE TABLE industry_l1 (
  ind_l1_id   INT          NOT NULL AUTO_INCREMENT,
  ind_l1_name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (ind_l1_id)
) ENGINE=InnoDB;

CREATE TABLE industry_l2 (
  ind_l2_id   INT          NOT NULL AUTO_INCREMENT,
  ind_l1_id   INT          NOT NULL,
  ind_l2_name VARCHAR(50)  NOT NULL,
  PRIMARY KEY (ind_l2_id),
  CONSTRAINT fk_industry_l2_l1
    FOREIGN KEY (ind_l1_id) REFERENCES industry_l1 (ind_l1_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_industry_l2_l1 ON industry_l2 (ind_l1_id);

-- ------------------------------------------------------------
-- 카드 혜택 추천 기준 (FR-13)
-- ------------------------------------------------------------

CREATE TABLE card_benefit (
  benefit_id      INT            NOT NULL AUTO_INCREMENT,
  card_name       VARCHAR(100)   NOT NULL COMMENT '카드명',
  target_type     ENUM('L1', 'L2', 'GENERAL') NOT NULL DEFAULT 'L2',
  ind_l1_id       INT            NULL COMMENT '업종(대분류) 매칭',
  ind_l2_id       INT            NULL COMMENT '카테고리(중분류) 매칭',
  category_label  VARCHAR(50)    NOT NULL COMMENT '적용 카테고리 표시명',
  benefit_desc    VARCHAR(255)   NOT NULL COMMENT '혜택 설명',
  PRIMARY KEY (benefit_id),
  CONSTRAINT fk_card_benefit_l1
    FOREIGN KEY (ind_l1_id) REFERENCES industry_l1 (ind_l1_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_card_benefit_l2
    FOREIGN KEY (ind_l2_id) REFERENCES industry_l2 (ind_l2_id)
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_card_benefit_target ON card_benefit (target_type, ind_l1_id, ind_l2_id);

-- ------------------------------------------------------------
-- 또래 평균·선호 (FR-10)
-- ------------------------------------------------------------

CREATE TABLE age_industry_pref (
  age_code          CHAR(2)        NOT NULL,
  ind_l1_id         INT            NOT NULL,
  ind_l2_id         INT            NOT NULL,
  avg_amount        DECIMAL(12, 0) NOT NULL DEFAULT 0,
  preference_score  DECIMAL(5, 2)  NULL,
  PRIMARY KEY (age_code, ind_l1_id, ind_l2_id),
  CONSTRAINT fk_pref_age
    FOREIGN KEY (age_code) REFERENCES age_group (age_code)
    ON UPDATE CASCADE,
  CONSTRAINT fk_pref_l1
    FOREIGN KEY (ind_l1_id) REFERENCES industry_l1 (ind_l1_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_pref_l2
    FOREIGN KEY (ind_l2_id) REFERENCES industry_l2 (ind_l2_id)
    ON UPDATE CASCADE,
  CONSTRAINT chk_pref_avg_amount CHECK (avg_amount >= 0)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 사용자 (FR-01, FR-02, FR-14)
-- ------------------------------------------------------------

CREATE TABLE users (
  user_id     INT          NOT NULL AUTO_INCREMENT,
  email       VARCHAR(100) NOT NULL,
  password    VARCHAR(255) NOT NULL COMMENT 'bcrypt 해시',
  username    VARCHAR(50)  NOT NULL,
  phone       VARCHAR(20)  NOT NULL,
  role        ENUM('USER', 'ANALYST', 'ADMIN') NOT NULL DEFAULT 'USER',
  is_active   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '0=비활성(FR-14)',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_phone UNIQUE (phone)
) ENGINE=InnoDB;

CREATE INDEX idx_users_role ON users (role);

-- ------------------------------------------------------------
-- 사용자 상세 — users 와 1:1 (클래스 다이어그램)
-- ------------------------------------------------------------

CREATE TABLE user_detail (
  user_id      INT         NOT NULL,
  age_code     CHAR(2)     NOT NULL,
  sex_code     CHAR(1)     NOT NULL,
  region_code  VARCHAR(10) NOT NULL DEFAULT '00' COMMENT '지역 코드',
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_detail_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_detail_age
    FOREIGN KEY (age_code) REFERENCES age_group (age_code)
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_detail_sex
    FOREIGN KEY (sex_code) REFERENCES sex_code (sex_code)
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 카드 소비 Fact (FR-04 ~ FR-07)
-- ------------------------------------------------------------

CREATE TABLE card_consumption (
  consumption_id  INT            NOT NULL AUTO_INCREMENT,
  user_id         INT            NOT NULL,
  ta_ymd          DATE           NOT NULL COMMENT '거래일자',
  day_code        CHAR(1)        NOT NULL,
  hour_code       CHAR(2)        NOT NULL,
  age_code        CHAR(2)        NOT NULL,
  sex_code        CHAR(1)        NOT NULL,
  ind_l1_id       INT            NOT NULL COMMENT '업종(대분류)',
  ind_l2_id       INT            NOT NULL COMMENT '카테고리(중분류)',
  amount          DECIMAL(12, 0) NOT NULL,
  count           INT            NOT NULL DEFAULT 1,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (consumption_id),
  CONSTRAINT fk_cons_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_cons_day
    FOREIGN KEY (day_code) REFERENCES day_of_week (day_code)
    ON UPDATE CASCADE,
  CONSTRAINT fk_cons_hour
    FOREIGN KEY (hour_code) REFERENCES hour_band (hour_code)
    ON UPDATE CASCADE,
  CONSTRAINT fk_cons_age
    FOREIGN KEY (age_code) REFERENCES age_group (age_code)
    ON UPDATE CASCADE,
  CONSTRAINT fk_cons_sex
    FOREIGN KEY (sex_code) REFERENCES sex_code (sex_code)
    ON UPDATE CASCADE,
  CONSTRAINT fk_cons_l1
    FOREIGN KEY (ind_l1_id) REFERENCES industry_l1 (ind_l1_id)
    ON UPDATE CASCADE,
  CONSTRAINT fk_cons_l2
    FOREIGN KEY (ind_l2_id) REFERENCES industry_l2 (ind_l2_id)
    ON UPDATE CASCADE,
  CONSTRAINT chk_cons_amount CHECK (amount >= 0),
  CONSTRAINT chk_cons_count  CHECK (count >= 1)
) ENGINE=InnoDB;

CREATE INDEX idx_cons_user_date   ON card_consumption (user_id, ta_ymd);
CREATE INDEX idx_cons_user_l2     ON card_consumption (user_id, ind_l2_id);
CREATE INDEX idx_cons_ta_ymd      ON card_consumption (ta_ymd);

-- ------------------------------------------------------------
-- 월간 소비 리포트 (FR-08, FR-09, FR-11)
-- ------------------------------------------------------------

CREATE TABLE monthly_report (
  report_id             INT            NOT NULL AUTO_INCREMENT,
  user_id               INT            NOT NULL,
  yyyymm                CHAR(6)        NOT NULL COMMENT 'YYYYMM',
  total_amount          DECIMAL(14, 0) NOT NULL DEFAULT 0,
  previous_month_rate   DECIMAL(7, 2)  NULL COMMENT '전월 대비 증감률(%)',
  generated_at          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  CONSTRAINT uq_monthly_report_user_month UNIQUE (user_id, yyyymm),
  CONSTRAINT fk_monthly_report_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_monthly_total CHECK (total_amount >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_monthly_report_yyyymm ON monthly_report (yyyymm);

-- ------------------------------------------------------------
-- 이상 소비 탐지 기록 (FR-12)
-- ------------------------------------------------------------

CREATE TABLE anomaly_record (
  anomaly_id      INT            NOT NULL AUTO_INCREMENT,
  user_id         INT            NOT NULL,
  consumption_id  INT            NOT NULL,
  compare_rate    DECIMAL(7, 2)  NOT NULL COMMENT '평균 대비 배율(%)',
  reason          VARCHAR(255)   NOT NULL,
  detected_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (anomaly_id),
  CONSTRAINT fk_anomaly_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_anomaly_consumption
    FOREIGN KEY (consumption_id) REFERENCES card_consumption (consumption_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT chk_anomaly_compare_rate CHECK (compare_rate >= 0)
) ENGINE=InnoDB;

CREATE INDEX idx_anomaly_user ON anomaly_record (user_id, detected_at);

-- ------------------------------------------------------------
-- 접근 로그 (FR-16)
-- ------------------------------------------------------------

CREATE TABLE access_log (
  log_id      BIGINT       NOT NULL AUTO_INCREMENT,
  user_id     INT          NULL COMMENT '비로그인 시 NULL',
  action      VARCHAR(50)  NOT NULL COMMENT 'LOGIN, LOGOUT, VIEW_REPORT 등',
  ip_address  VARCHAR(45)  NULL,
  user_agent  VARCHAR(255) NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'SUCCESS',
  detail      VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  CONSTRAINT fk_access_log_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_access_log_user    ON access_log (user_id, created_at);
CREATE INDEX idx_access_log_action  ON access_log (action, created_at);
