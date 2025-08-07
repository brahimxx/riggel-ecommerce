USE riggel_ecommerce;
SET SQL_SAFE_UPDATES = 0;

-- Clear tables respecting FK constraints (delete child tables first)
DELETE FROM reviews;
DELETE FROM product_images;
DELETE FROM payments;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM users;
DELETE FROM categories;

-- Insert categories
INSERT INTO categories (parent_category_id, name, description) VALUES
  (NULL, 'Clothing', 'Apparel, shirts, pants, jackets'),
  (NULL, 'Electronics', 'Phones, gadgets, accessories'),
  (NULL, 'Home & Kitchen', 'Furniture, Decor, Utensils'),
  (NULL, 'Books', 'Fiction, Non-fiction, Educational'),
  (NULL, 'Toys', 'Action figures, Puzzles, Educational toys'),
  (NULL, 'Sports', 'Sports equipment and accessories');

-- Insert users
INSERT INTO users (username, email, password, role, created_at) VALUES
  ('admin', 'admin@example.com', '$2b$10$ZPTvSCCuMwmFcXF2lHUg9.Beh0wann0SOEIq1EzLM3YKtJ/I8sbBG', 'admin', NOW()),
  ('johndoe', 'johndoe@example.com', '$2b$10$abcdefghijklmnopqrstuv', 'user', NOW()),
  ('janesmith', 'janesmith@example.com', '$2b$10$zyxwvutsrqponmlkjihgf', 'user', NOW()),
  ('guestuser', 'guest@example.com', '$2b$10$qwertyuiopasdfghjklzxcvbnm', 'user', NOW());

-- Insert products
INSERT INTO products (name, description, price, category_id, created_at, quantity) VALUES
  -- Clothing
  ('T-Shirt', 'Comfortable cotton t-shirt', 19.99, (SELECT category_id FROM categories WHERE name = 'Clothing'), NOW(), 100),
  ('Jeans', 'Stylish blue jeans', 49.99, (SELECT category_id FROM categories WHERE name = 'Clothing'), NOW(), 70),
  ('Jacket', 'Warm winter jacket', 89.99, (SELECT category_id FROM categories WHERE name = 'Clothing'), NOW(), 40),
  -- Electronics
  ('Smartphone', 'Latest model smartphone', 599.99, (SELECT category_id FROM categories WHERE name = 'Electronics'), NOW(), 50),
  ('Wireless Earbuds', 'Noise-cancelling earbuds', 129.99, (SELECT category_id FROM categories WHERE name = 'Electronics'), NOW(), 150),
  ('Smartwatch', 'Feature-packed smartwatch', 199.99, (SELECT category_id FROM categories WHERE name = 'Electronics'), NOW(), 80),
  -- Home & Kitchen
  ('Coffee Maker', 'Automatic drip coffee maker', 79.99, (SELECT category_id FROM categories WHERE name = 'Home & Kitchen'), NOW(), 60),
  ('Blender', 'Multi-speed blender', 49.99, (SELECT category_id FROM categories WHERE name = 'Home & Kitchen'), NOW(), 55),
  ('Vacuum Cleaner', 'Powerful vacuum cleaner', 149.99, (SELECT category_id FROM categories WHERE name = 'Home & Kitchen'), NOW(), 35),
  -- Books
  ('The Great Gatsby', 'Classic fiction novel by F. Scott Fitzgerald', 14.99, (SELECT category_id FROM categories WHERE name = 'Books'), NOW(), 200),
  ('Calculus Textbook', 'Comprehensive college calculus book', 89.99, (SELECT category_id FROM categories WHERE name = 'Books'), NOW(), 30),
  -- Toys
  ('Action Figure', 'Superhero action figure', 24.99, (SELECT category_id FROM categories WHERE name = 'Toys'), NOW(), 100),
  ('Puzzle 1000 Pieces', 'Challenging jigsaw puzzle', 19.99, (SELECT category_id FROM categories WHERE name = 'Toys'), NOW(), 80),
  -- Sports
  ('Football', 'Official size and weight football', 29.99, (SELECT category_id FROM categories WHERE name = 'Sports'), NOW(), 70),
  ('Yoga Mat', 'Eco-friendly yoga mat', 39.99, (SELECT category_id FROM categories WHERE name = 'Sports'), NOW(), 90);

-- Insert product images
INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary) VALUES
  -- T-Shirt
  ((SELECT product_id FROM products WHERE name = 'T-Shirt'), '/images/tshirt1.png', 'Front view of T-Shirt', 0, TRUE),
  ((SELECT product_id FROM products WHERE name = 'T-Shirt'), '/images/tshirt2.png', 'Back view of T-Shirt', 1, FALSE),
  -- Jeans
  ((SELECT product_id FROM products WHERE name = 'Jeans'), '/images/jeans1.png', 'Front view of Jeans', 0, TRUE),
  -- Smartphone
  ((SELECT product_id FROM products WHERE name = 'Smartphone'), '/images/smartphone1.png', 'Smartphone front', 0, TRUE),
  ((SELECT product_id FROM products WHERE name = 'Smartphone'), '/images/smartphone2.png', 'Smartphone side', 1, FALSE),
  -- Wireless Earbuds
  ((SELECT product_id FROM products WHERE name = 'Wireless Earbuds'), '/images/earbuds1.png', 'Earbuds in case', 0, TRUE),
  -- Coffee Maker
  ((SELECT product_id FROM products WHERE name = 'Coffee Maker'), '/images/coffee_maker.png', 'Coffee Maker machine', 0, TRUE),
  -- The Great Gatsby
  ((SELECT product_id FROM products WHERE name = 'The Great Gatsby'), '/images/gatsby.png', 'Book cover', 0, TRUE),
  -- Football
  ((SELECT product_id FROM products WHERE name = 'Football'), '/images/football.png', 'Official size football', 0, TRUE);

-- Insert orders
INSERT INTO orders (client_name, email, phone, shipping_address, order_date, status, total_amount) VALUES
  ('John Doe', 'john.doe@example.com', '123-456-7890', '123 Elm Street, Springfield', NOW(), 'Pending', 149.97),
  ('Jane Smith', 'janesmith@example.com', '987-654-3210', '456 Maple Ave, Pleasantville', NOW(), 'Completed', 79.99),
  ('Guest User', 'guest@example.com', NULL, '789 Oak Road, Springfield', NOW(), 'Shipped', 199.98);

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
  ((SELECT order_id FROM orders WHERE client_name = 'John Doe' LIMIT 1), (SELECT product_id FROM products WHERE name = 'T-Shirt'), 2, 19.99),
  ((SELECT order_id FROM orders WHERE client_name = 'John Doe' LIMIT 1), (SELECT product_id FROM products WHERE name = 'Jeans'), 1, 49.99),
  ((SELECT order_id FROM orders WHERE client_name = 'Jane Smith' LIMIT 1), (SELECT product_id FROM products WHERE name = 'Coffee Maker'), 1, 79.99),
  ((SELECT order_id FROM orders WHERE client_name = 'Guest User' LIMIT 1), (SELECT product_id FROM products WHERE name = 'Wireless Earbuds'), 2, 129.99);

-- Insert payments
INSERT INTO payments (order_id, amount, method, status, timestamp) VALUES
  ((SELECT order_id FROM orders WHERE client_name = 'John Doe' LIMIT 1), 89.97, 'Credit Card', 'Pending', NOW()),
  ((SELECT order_id FROM orders WHERE client_name = 'Jane Smith' LIMIT 1), 79.99, 'PayPal', 'Completed', NOW()),
  ((SELECT order_id FROM orders WHERE client_name = 'Guest User' LIMIT 1), 259.98, 'Credit Card', 'Completed', NOW());

-- Insert reviews
INSERT INTO reviews (product_id, client_name, rating, comment, date) VALUES
  ((SELECT product_id FROM products WHERE name = 'T-Shirt'), 'Jane Smith', 5, 'Great quality and fit!', NOW()),
  ((SELECT product_id FROM products WHERE name = 'Smartphone'), 'John Doe', 4, 'Excellent phone, battery life could be better.', NOW()),
  ((SELECT product_id FROM products WHERE name = 'Coffee Maker'), 'Guest User', 5, 'Makes great coffee fast!', NOW()),
  ((SELECT product_id FROM products WHERE name = 'Wireless Earbuds'), 'Jane Smith', 3, 'Good sound but uncomfortable for long use.', NOW());
