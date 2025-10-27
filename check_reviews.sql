-- Check if Review table exists and has any rows
SELECT COUNT(*) as review_count FROM reviews;

-- Check all orders for your user
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    o.payment_status,
    o.status,
    o.created_at
FROM orders o
ORDER BY o.created_at DESC
LIMIT 10;

-- Check order items (products you've purchased)
SELECT 
    oi.id,
    oi.order_id,
    oi.product_id,
    p.name as product_name,
    o.payment_status,
    o.status
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN products p ON oi.product_id = p.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Check for any reviews (should be 0)
SELECT * FROM reviews;





