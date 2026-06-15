-- FR-13: 카드 혜택 추천 테이블 추가 (기존 DB 마이그레이션)
USE geumso_pae;

CREATE TABLE IF NOT EXISTS card_benefit (
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

INSERT IGNORE INTO card_benefit (benefit_id, card_name, target_type, ind_l1_id, ind_l2_id, category_label, benefit_desc) VALUES
(1, '맛있는 식음료 카드', 'L1', 1, NULL, '식비·생활편의', '외식·카페·배달 업종 10% 할인'),
(2, '카페 데이 카드', 'L2', 1, 3, '커피/디저트', '카페·디저트 전용 15% 캐시백'),
(3, '배달킹 카드', 'L2', 1, 2, '배달', '배달앱 12% 즉시할인'),
(4, '쇼핑 적립 카드', 'L1', 2, NULL, '쇼핑·패션·뷰티', '백화점·온라인몰 7% 포인트 적립'),
(5, '교통 패스 카드', 'L1', 3, NULL, '교통·자동차', '대중교통·주유 10% 환급'),
(6, '올라운드 캐시백 카드', 'GENERAL', NULL, NULL, '전체 업종', '모든 가맹점 1.5% 캐시백');
