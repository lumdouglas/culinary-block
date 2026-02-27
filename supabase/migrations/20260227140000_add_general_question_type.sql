-- Allow 'general_question' as a valid type in the requests table.
-- The requests table was originally created with CHECK (type IN ('maintenance', 'rule_violation')),
-- which causes an error when the Contact Us → General Question form submits type='general_question'.

ALTER TABLE requests
  DROP CONSTRAINT IF EXISTS requests_type_check;

ALTER TABLE requests
  ADD CONSTRAINT requests_type_check
    CHECK (type IN ('maintenance', 'rule_violation', 'general_question'));
