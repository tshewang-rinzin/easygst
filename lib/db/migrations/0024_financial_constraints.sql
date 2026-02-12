-- Financial integrity constraints
-- Add CHECK constraints on financial amounts to prevent invalid data

-- Invoice amounts must be non-negative and within bounds
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_subtotal CHECK (subtotal >= 0 AND subtotal < 999999999);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_total_amount CHECK (total_amount >= 0 AND total_amount < 999999999);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_total_tax CHECK (total_tax >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_total_discount CHECK (total_discount >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_amount_paid CHECK (amount_paid >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_amount_due CHECK (amount_due >= 0);

-- Invoice items
ALTER TABLE invoice_items ADD CONSTRAINT chk_invoice_items_quantity CHECK (quantity > 0);
ALTER TABLE invoice_items ADD CONSTRAINT chk_invoice_items_unit_price CHECK (unit_price >= 0);
ALTER TABLE invoice_items ADD CONSTRAINT chk_invoice_items_line_total CHECK (line_total >= 0);
ALTER TABLE invoice_items ADD CONSTRAINT chk_invoice_items_tax_amount CHECK (tax_amount >= 0);
ALTER TABLE invoice_items ADD CONSTRAINT chk_invoice_items_item_total CHECK (item_total >= 0);
ALTER TABLE invoice_items ADD CONSTRAINT chk_invoice_items_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- Supplier bill amounts
ALTER TABLE supplier_bills ADD CONSTRAINT chk_bills_subtotal CHECK (subtotal >= 0 AND subtotal < 999999999);
ALTER TABLE supplier_bills ADD CONSTRAINT chk_bills_total_amount CHECK (total_amount >= 0 AND total_amount < 999999999);
ALTER TABLE supplier_bills ADD CONSTRAINT chk_bills_total_tax CHECK (total_tax >= 0);
ALTER TABLE supplier_bills ADD CONSTRAINT chk_bills_total_discount CHECK (total_discount >= 0);
ALTER TABLE supplier_bills ADD CONSTRAINT chk_bills_amount_paid CHECK (amount_paid >= 0);
ALTER TABLE supplier_bills ADD CONSTRAINT chk_bills_amount_due CHECK (amount_due >= 0);

-- Supplier bill items
ALTER TABLE supplier_bill_items ADD CONSTRAINT chk_bill_items_quantity CHECK (quantity > 0);
ALTER TABLE supplier_bill_items ADD CONSTRAINT chk_bill_items_unit_price CHECK (unit_price >= 0);
ALTER TABLE supplier_bill_items ADD CONSTRAINT chk_bill_items_line_total CHECK (line_total >= 0);
ALTER TABLE supplier_bill_items ADD CONSTRAINT chk_bill_items_tax_amount CHECK (tax_amount >= 0);
ALTER TABLE supplier_bill_items ADD CONSTRAINT chk_bill_items_item_total CHECK (item_total >= 0);
ALTER TABLE supplier_bill_items ADD CONSTRAINT chk_bill_items_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- Customer payments
ALTER TABLE customer_payments ADD CONSTRAINT chk_customer_payments_amount CHECK (amount > 0 AND amount < 999999999);
ALTER TABLE customer_payments ADD CONSTRAINT chk_customer_payments_allocated CHECK (allocated_amount >= 0);
ALTER TABLE customer_payments ADD CONSTRAINT chk_customer_payments_unallocated CHECK (unallocated_amount >= 0);

-- Payment allocations
ALTER TABLE payment_allocations ADD CONSTRAINT chk_payment_allocations_amount CHECK (allocated_amount > 0);

-- Supplier payments
ALTER TABLE supplier_payments ADD CONSTRAINT chk_supplier_payments_amount CHECK (amount > 0 AND amount < 999999999);
ALTER TABLE supplier_payments ADD CONSTRAINT chk_supplier_payments_allocated CHECK (allocated_amount >= 0);
ALTER TABLE supplier_payments ADD CONSTRAINT chk_supplier_payments_unallocated CHECK (unallocated_amount >= 0);

-- Supplier payment allocations
ALTER TABLE supplier_payment_allocations ADD CONSTRAINT chk_supplier_payment_allocations_amount CHECK (allocated_amount > 0);

-- Credit notes
ALTER TABLE credit_notes ADD CONSTRAINT chk_credit_notes_total_amount CHECK (total_amount >= 0 AND total_amount < 999999999);
ALTER TABLE credit_notes ADD CONSTRAINT chk_credit_notes_applied CHECK (applied_amount >= 0);
ALTER TABLE credit_notes ADD CONSTRAINT chk_credit_notes_unapplied CHECK (unapplied_amount >= 0);
ALTER TABLE credit_notes ADD CONSTRAINT chk_credit_notes_refunded CHECK (refunded_amount >= 0);

-- Credit note items
ALTER TABLE credit_note_items ADD CONSTRAINT chk_cn_items_quantity CHECK (quantity > 0);
ALTER TABLE credit_note_items ADD CONSTRAINT chk_cn_items_unit_price CHECK (unit_price >= 0);
ALTER TABLE credit_note_items ADD CONSTRAINT chk_cn_items_item_total CHECK (item_total >= 0);

-- Credit note applications
ALTER TABLE credit_note_applications ADD CONSTRAINT chk_cn_applications_amount CHECK (applied_amount > 0);

-- Debit notes
ALTER TABLE debit_notes ADD CONSTRAINT chk_debit_notes_total_amount CHECK (total_amount >= 0 AND total_amount < 999999999);
ALTER TABLE debit_notes ADD CONSTRAINT chk_debit_notes_applied CHECK (applied_amount >= 0);
ALTER TABLE debit_notes ADD CONSTRAINT chk_debit_notes_unapplied CHECK (unapplied_amount >= 0);
ALTER TABLE debit_notes ADD CONSTRAINT chk_debit_notes_refunded CHECK (refunded_amount >= 0);

-- Debit note items
ALTER TABLE debit_note_items ADD CONSTRAINT chk_dn_items_quantity CHECK (quantity > 0);
ALTER TABLE debit_note_items ADD CONSTRAINT chk_dn_items_unit_price CHECK (unit_price >= 0);
ALTER TABLE debit_note_items ADD CONSTRAINT chk_dn_items_item_total CHECK (item_total >= 0);

-- Debit note applications
ALTER TABLE debit_note_applications ADD CONSTRAINT chk_dn_applications_amount CHECK (applied_amount > 0);

-- Products
ALTER TABLE products ADD CONSTRAINT chk_products_unit_price CHECK (unit_price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_tax_rate CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100);

-- Sequence lock timeout: auto-release locks older than 30 seconds
-- This is implemented at the application level in the numbering functions
