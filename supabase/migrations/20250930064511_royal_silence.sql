/*
  # Insert Sample Data

  1. Sample Products
  2. Sample Banners
  3. Sample Reviews (for demo)
*/

-- Insert sample banners
INSERT INTO banners (title, subtitle, image_url, button_text, link_url, sort_order) VALUES
('Summer Collection 2025', 'Up to 50% Off on All Dresses', 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg', 'Shop Now', '/products', 1),
('Traditional Wear', 'Authentic Indian Ethnic Wear', 'https://images.pexels.com/photos/8555576/pexels-photo-8555576.jpeg', 'Explore', '/category/ethnic', 2),
('Western Styles', 'Latest Western Fashion Trends', 'https://images.pexels.com/photos/7679721/pexels-photo-7679721.jpeg', 'Discover', '/category/western', 3);

-- Insert sample products
INSERT INTO products (name, description, price, mrp, discount, category, images, sizes, colors, stock_quantity, offer_ends_at) VALUES
('Elegant Silk Saree', 'Beautiful traditional silk saree with intricate embroidery work. Perfect for weddings and special occasions. Made from premium quality silk with gold zari work.', 2499, 4999, 50, 'sarees', 
 ARRAY['https://images.pexels.com/photos/8555576/pexels-photo-8555576.jpeg'], 
 ARRAY['Free Size'], 
 ARRAY['Red', 'Blue', 'Green'], 25, now() + interval '2 days'),

('Designer Anarkali Dress', 'Stunning anarkali dress perfect for special occasions. Features beautiful embroidery and comfortable fit. Made from premium cotton blend fabric.', 1799, 2999, 40, 'ethnic', 
 ARRAY['https://images.pexels.com/photos/9558739/pexels-photo-9558739.jpeg'], 
 ARRAY['S', 'M', 'L', 'XL'], 
 ARRAY['Pink', 'Yellow', 'Orange'], 30, now() + interval '3 days'),

('Western Midi Dress', 'Trendy midi dress perfect for casual outings. Comfortable and stylish design suitable for daily wear. Made from breathable cotton fabric.', 1299, 1999, 35, 'western', 
 ARRAY['https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg'], 
 ARRAY['XS', 'S', 'M', 'L'], 
 ARRAY['Black', 'White', 'Navy'], 40, now() + interval '1 day'),

('Traditional Lehenga Choli', 'Exquisite lehenga choli with mirror work and embellishments. Perfect for festivals and celebrations. Includes dupatta and blouse.', 3999, 7999, 50, 'ethnic', 
 ARRAY['https://images.pexels.com/photos/8555577/pexels-photo-8555577.jpeg'], 
 ARRAY['S', 'M', 'L', 'XL'], 
 ARRAY['Red', 'Pink', 'Maroon'], 15, now() + interval '4 days'),

('Floral Maxi Dress', 'Elegant floral print maxi dress for summer. Lightweight and comfortable with beautiful floral patterns. Perfect for beach outings and casual wear.', 999, 1599, 37, 'western', 
 ARRAY['https://images.pexels.com/photos/7679721/pexels-photo-7679721.jpeg'], 
 ARRAY['S', 'M', 'L'], 
 ARRAY['Floral Blue', 'Floral Pink'], 35, now() + interval '5 days'),

('Banarasi Silk Saree', 'Premium Banarasi silk saree with gold zari work. Handwoven by skilled artisans. A timeless piece for your wardrobe.', 4999, 9999, 50, 'sarees', 
 ARRAY['https://images.pexels.com/photos/8555578/pexels-photo-8555578.jpeg'], 
 ARRAY['Free Size'], 
 ARRAY['Gold', 'Silver', 'Bronze'], 10, now() + interval '2 days'),

('Party Wear Jumpsuit', 'Stylish jumpsuit perfect for party occasions. Modern design with comfortable fit. Made from premium polyester blend.', 1599, 2499, 36, 'western', 
 ARRAY['https://images.pexels.com/photos/7679722/pexels-photo-7679722.jpeg'], 
 ARRAY['S', 'M', 'L', 'XL'], 
 ARRAY['Black', 'Red', 'Blue'], 20, now() + interval '6 days'),

('Cotton Salwar Kameez', 'Comfortable cotton salwar kameez for daily wear. Breathable fabric with beautiful prints. Includes dupatta.', 899, 1499, 40, 'ethnic', 
 ARRAY['https://images.pexels.com/photos/9558740/pexels-photo-9558740.jpeg'], 
 ARRAY['S', 'M', 'L', 'XL', 'XXL'], 
 ARRAY['White', 'Cream', 'Light Blue'], 50, now() + interval '3 days'),

('Georgette Kurti', 'Elegant georgette kurti with beautiful embroidery. Perfect for office wear and casual outings. Comfortable and stylish.', 799, 1299, 38, 'ethnic',
 ARRAY['https://images.pexels.com/photos/9558741/pexels-photo-9558741.jpeg'],
 ARRAY['S', 'M', 'L', 'XL'],
 ARRAY['Purple', 'Green', 'Blue'], 45, now() + interval '7 days'),

('Denim Jacket Dress', 'Trendy denim jacket dress perfect for casual wear. Comfortable fit with modern styling. Great for everyday use.', 1199, 1899, 37, 'western',
 ARRAY['https://images.pexels.com/photos/7679723/pexels-photo-7679723.jpeg'],
 ARRAY['XS', 'S', 'M', 'L', 'XL'],
 ARRAY['Light Blue', 'Dark Blue', 'Black'], 25, now() + interval '8 days');