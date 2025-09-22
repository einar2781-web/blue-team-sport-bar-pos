-- Restaurant POS Cloud - Seed Data
-- Sample data for development and testing

-- Clear existing data in correct order (respecting foreign keys)
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE organization_settings CASCADE;
TRUNCATE TABLE reservations CASCADE;
TRUNCATE TABLE promotion_usages CASCADE;
TRUNCATE TABLE promotions CASCADE;
TRUNCATE TABLE loyalty_transactions CASCADE;
TRUNCATE TABLE loyalty_programs CASCADE;
TRUNCATE TABLE recipe_items CASCADE;
TRUNCATE TABLE purchase_order_items CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE stock_movements CASCADE;
TRUNCATE TABLE inventory_items CASCADE;
TRUNCATE TABLE suppliers CASCADE;
TRUNCATE TABLE customer_addresses CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE order_item_modifiers CASCADE;
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE tables CASCADE;
TRUNCATE TABLE sections CASCADE;
TRUNCATE TABLE product_modifier_groups CASCADE;
TRUNCATE TABLE modifier_options CASCADE;
TRUNCATE TABLE product_modifiers CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE organizations CASCADE;

-- Sample Organizations (Restaurants)
INSERT INTO organizations (id, name, business_name, address, city, state, country, phone, email, currency, tax_rate) VALUES
('11111111-1111-1111-1111-111111111111', 'Restaurante El Sazón Mexicano', 'El Sazón Mexicano S.A. de C.V.', 'Av. Revolución 123', 'Ciudad de México', 'CDMX', 'Mexico', '+52-55-1234-5678', 'admin@elsazonmexicano.com', 'MXN', 0.1600),
('22222222-2222-2222-2222-222222222222', 'Pizzeria Bella Italia', 'Bella Italia Restaurante S.A.', 'Calle Roma 456', 'Guadalajara', 'Jalisco', 'Mexico', '+52-33-8765-4321', 'info@bellaitalia.mx', 'MXN', 0.1600),
('33333333-3333-3333-3333-333333333333', 'Café Central', 'Central Coffee & Bistro', 'Plaza Principal 789', 'Monterrey', 'Nuevo León', 'Mexico', '+52-81-9876-5432', 'contacto@cafecentral.com', 'MXN', 0.1600);

-- Sample Users (Staff)
INSERT INTO users (id, organization_id, username, email, password_hash, first_name, last_name, role, pin_code) VALUES
-- El Sazón Mexicano Staff
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin1', 'admin@elsazonmexicano.com', '$2b$10$rOvHrNqE7lQjY8qKs0VbZuB.W8dHDXzn5hGc9aJ8rK3mL7pQ2sT6u', 'María', 'González', 'admin', '1234'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'manager1', 'manager@elsazonmexicano.com', '$2b$10$rOvHrNqE7lQjY8qKs0VbZuB.W8dHDXzn5hGc9aJ8rK3mL7pQ2sT6u', 'Carlos', 'Ramírez', 'manager', '2345'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'cashier1', 'cajera@elsazonmexicano.com', '$2b$10$rOvHrNqE7lQjY8qKs0VbZuB.W8dHDXzn5hGc9aJ8rK3mL7pQ2sT6u', 'Ana', 'López', 'cashier', '3456'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'waiter1', 'mesero1@elsazonmexicano.com', '$2b$10$rOvHrNqE7lQjY8qKs0VbZuB.W8dHDXzn5hGc9aJ8rK3mL7pQ2sT6u', 'José', 'Martínez', 'waiter', '4567'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'waiter2', 'mesero2@elsazonmexicano.com', '$2b$10$rOvHrNqE7lQjY8qKs0VbZuB.W8dHDXzn5hGc9aJ8rK3mL7pQ2sT6u', 'Patricia', 'Hernández', 'waiter', '5678'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'kitchen1', 'cocina@elsazonmexicano.com', '$2b$10$rOvHrNqE7lQjY8qKs0VbZuB.W8dHDXzn5hGc9aJ8rK3mL7pQ2sT6u', 'Roberto', 'Sánchez', 'kitchen', '6789');

-- Sample Categories
INSERT INTO categories (id, organization_id, name, description, color, sort_order) VALUES
-- El Sazón Mexicano Categories
('cat11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Antojitos', 'Antojitos mexicanos tradicionales', '#F59E0B', 1),
('cat22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Platos Fuertes', 'Platillos principales con carne y pollo', '#EF4444', 2),
('cat33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Mariscos', 'Especialidades del mar', '#3B82F6', 3),
('cat44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Bebidas', 'Refrescos, aguas y bebidas tradicionales', '#10B981', 4),
('cat55555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Postres', 'Dulces tradicionales mexicanos', '#8B5CF6', 5);

-- Sample Products
INSERT INTO products (id, organization_id, category_id, sku, name, description, price, prep_time, is_vegetarian, is_spicy) VALUES
-- Antojitos
('prod1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'ANT001', 'Tacos de Pastor', 'Tacos de trompo con piña, cebolla y cilantro', 35.00, 8, false, true),
('prod2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'ANT002', 'Quesadillas de Flor de Calabaza', 'Quesadillas rellenas de flor de calabaza con queso Oaxaca', 45.00, 10, true, false),
('prod3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'ANT003', 'Sopes de Frijol', 'Sopes con frijoles refritos, lechuga, queso y crema', 30.00, 12, true, false),
('prod4444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'cat11111-1111-1111-1111-111111111111', 'ANT004', 'Tamales Oaxaqueños', 'Tamales envueltos en hoja de plátano con mole', 40.00, 15, false, true),

-- Platos Fuertes
('prod5555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'cat22222-2222-2222-2222-222222222222', 'PF001', 'Mole Poblano', 'Pollo en mole poblano con arroz y tortillas', 165.00, 25, false, true),
('prod6666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'cat22222-2222-2222-2222-222222222222', 'PF002', 'Carne Asada', 'Arrachera a la parrilla con guacamole y frijoles charros', 185.00, 20, false, false),
('prod7777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'cat22222-2222-2222-2222-222222222222', 'PF003', 'Chiles Rellenos', 'Chiles poblanos rellenos de queso, capeados', 125.00, 30, true, true),
('prod8888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'cat22222-2222-2222-2222-222222222222', 'PF004', 'Cochinita Pibil', 'Cochinita pibil con tortillas y cebolla morada', 155.00, 22, false, true),

-- Mariscos
('prod9999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'cat33333-3333-3333-3333-333333333333', 'MAR001', 'Ceviche de Camarón', 'Camarones frescos en jugo de limón con verduras', 145.00, 15, false, true),
('prodaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'cat33333-3333-3333-3333-333333333333', 'MAR002', 'Pescado a la Veracruzana', 'Filete de pescado en salsa veracruzana', 175.00, 25, false, false),
('prodbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'cat33333-3333-3333-3333-333333333333', 'MAR003', 'Camarones al Mojo de Ajo', 'Camarones grandes salteados en mantequilla y ajo', 195.00, 18, false, false),

-- Bebidas
('prodcccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'cat44444-4444-4444-4444-444444444444', 'BEB001', 'Agua de Horchata', 'Agua fresca de horchata tradicional', 25.00, 3, true, false),
('proddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'cat44444-4444-4444-4444-444444444444', 'BEB002', 'Agua de Jamaica', 'Agua de jamaica natural sin azúcar', 22.00, 3, true, false),
('prodeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'cat44444-4444-4444-4444-444444444444', 'BEB003', 'Coca Cola', 'Refresco Coca Cola 600ml', 28.00, 1, true, false),
('prodffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'cat44444-4444-4444-4444-444444444444', 'BEB004', 'Cerveza Corona', 'Cerveza Corona 355ml', 35.00, 1, true, false),

-- Postres
('prodgggg-gggg-gggg-gggg-gggggggggggg', '11111111-1111-1111-1111-111111111111', 'cat55555-5555-5555-5555-555555555555', 'POS001', 'Flan Napolitano', 'Flan tradicional con caramelo', 45.00, 5, true, false),
('prodhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '11111111-1111-1111-1111-111111111111', 'cat55555-5555-5555-5555-555555555555', 'POS002', 'Churros con Cajeta', 'Churros caseros con cajeta de cabra', 38.00, 8, true, false);

-- Sample Product Modifiers
INSERT INTO product_modifiers (id, organization_id, name, type, is_required, max_selections) VALUES
('mod11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Tipo de Carne', 'single', true, 1),
('mod22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Extras', 'multiple', false, 5),
('mod33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Término de Carne', 'single', true, 1),
('mod44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Nivel de Picante', 'single', false, 1);

-- Sample Modifier Options
INSERT INTO modifier_options (modifier_id, name, price_adjustment, is_default, sort_order) VALUES
-- Tipo de Carne
('mod11111-1111-1111-1111-111111111111', 'Pastor', 0.00, true, 1),
('mod11111-1111-1111-1111-111111111111', 'Carnitas', 5.00, false, 2),
('mod11111-1111-1111-1111-111111111111', 'Pollo', 0.00, false, 3),
('mod11111-1111-1111-1111-111111111111', 'Bistek', 8.00, false, 4),

-- Extras
('mod22222-2222-2222-2222-222222222222', 'Guacamole', 15.00, false, 1),
('mod22222-2222-2222-2222-222222222222', 'Queso Extra', 10.00, false, 2),
('mod22222-2222-2222-2222-222222222222', 'Frijoles', 8.00, false, 3),
('mod22222-2222-2222-2222-222222222222', 'Crema', 5.00, false, 4),
('mod22222-2222-2222-2222-222222222222', 'Pico de Gallo', 6.00, false, 5),

-- Término de Carne
('mod33333-3333-3333-3333-333333333333', 'Bien Cocido', 0.00, true, 1),
('mod33333-3333-3333-3333-333333333333', 'Término Medio', 0.00, false, 2),
('mod33333-3333-3333-3333-333333333333', 'Tres Cuartos', 0.00, false, 3),

-- Nivel de Picante
('mod44444-4444-4444-4444-444444444444', 'Sin Picante', 0.00, true, 1),
('mod44444-4444-4444-4444-444444444444', 'Poco Picante', 0.00, false, 2),
('mod44444-4444-4444-4444-444444444444', 'Picante', 0.00, false, 3),
('mod44444-4444-4444-4444-444444444444', 'Muy Picante', 0.00, false, 4);

-- Sample Sections (Restaurant Areas)
INSERT INTO sections (id, organization_id, name, description, color) VALUES
('sec11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Terraza', 'Área exterior con vista al jardín', '#10B981'),
('sec22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Salón Principal', 'Área principal del restaurante', '#3B82F6'),
('sec33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Área VIP', 'Sección privada para eventos especiales', '#F59E0B');

-- Sample Tables
INSERT INTO tables (id, organization_id, section_id, number, name, capacity, x_position, y_position, width, height) VALUES
-- Terraza
('tab11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'sec11111-1111-1111-1111-111111111111', '1', 'Mesa 1', 4, 50.00, 50.00, 80.00, 80.00),
('tab22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'sec11111-1111-1111-1111-111111111111', '2', 'Mesa 2', 2, 200.00, 50.00, 60.00, 60.00),
('tab33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'sec11111-1111-1111-1111-111111111111', '3', 'Mesa 3', 6, 350.00, 50.00, 100.00, 100.00),

-- Salón Principal
('tab44444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'sec22222-2222-2222-2222-222222222222', '4', 'Mesa 4', 4, 50.00, 200.00, 80.00, 80.00),
('tab55555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'sec22222-2222-2222-2222-222222222222', '5', 'Mesa 5', 4, 200.00, 200.00, 80.00, 80.00),
('tab66666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'sec22222-2222-2222-2222-222222222222', '6', 'Mesa 6', 2, 350.00, 200.00, 60.00, 60.00),
('tab77777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'sec22222-2222-2222-2222-222222222222', '7', 'Mesa 7', 8, 500.00, 200.00, 120.00, 120.00),

-- Área VIP
('tab88888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'sec33333-3333-3333-3333-333333333333', '8', 'Mesa VIP 1', 10, 50.00, 350.00, 150.00, 150.00),
('tab99999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'sec33333-3333-3333-3333-333333333333', '9', 'Mesa VIP 2', 6, 250.00, 350.00, 100.00, 100.00);

-- Sample Customers
INSERT INTO customers (id, organization_id, customer_number, first_name, last_name, email, phone, loyalty_points, total_spent, visit_count) VALUES
('cust1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CUST001', 'Juan', 'Pérez', 'juan.perez@email.com', '+52-55-1111-2222', 150, 1250.00, 8),
('cust2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'CUST002', 'María', 'Rodríguez', 'maria.rodriguez@email.com', '+52-55-3333-4444', 320, 2890.00, 15),
('cust3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'CUST003', 'Carlos', 'García', 'carlos.garcia@email.com', '+52-55-5555-6666', 85, 765.00, 4);

-- Sample Orders (Recent orders for demo)
INSERT INTO orders (id, organization_id, order_number, table_id, waiter_id, customer_id, guest_count, subtotal, tax_amount, total_amount, status, created_at) VALUES
('ord11111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'ORD-20250921-0001', 'tab11111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'cust1111-1111-1111-1111-111111111111', 2, 180.00, 28.80, 208.80, 'preparing', NOW() - INTERVAL '15 minutes'),
('ord22222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'ORD-20250921-0002', 'tab44444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'cust2222-2222-2222-2222-222222222222', 4, 320.00, 51.20, 371.20, 'ready', NOW() - INTERVAL '5 minutes'),
('ord33333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'ORD-20250921-0003', 'tab22222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, 2, 95.00, 15.20, 110.20, 'served', NOW() - INTERVAL '45 minutes');

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price, status) VALUES
-- Order 1
('ord11111-1111-1111-1111-111111111111', 'prod1111-1111-1111-1111-111111111111', 2, 35.00, 70.00, 'preparing'),
('ord11111-1111-1111-1111-111111111111', 'prod5555-5555-5555-5555-555555555555', 1, 165.00, 165.00, 'preparing'),
('ord11111-1111-1111-1111-111111111111', 'prodcccc-cccc-cccc-cccc-cccccccccccc', 2, 25.00, 50.00, 'ready'),

-- Order 2
('ord22222-2222-2222-2222-222222222222', 'prod6666-6666-6666-6666-666666666666', 1, 185.00, 185.00, 'ready'),
('ord22222-2222-2222-2222-222222222222', 'prod9999-9999-9999-9999-999999999999', 1, 145.00, 145.00, 'ready'),
('ord22222-2222-2222-2222-222222222222', 'prodffff-ffff-ffff-ffff-ffffffffffff', 4, 35.00, 140.00, 'served'),

-- Order 3
('ord33333-3333-3333-3333-333333333333', 'prod2222-2222-2222-2222-222222222222', 2, 45.00, 90.00, 'served'),
('ord33333-3333-3333-3333-333333333333', 'proddddd-dddd-dddd-dddd-dddddddddddd', 2, 22.00, 44.00, 'served');

-- Sample Suppliers
INSERT INTO suppliers (organization_id, name, contact_person, email, phone, address) VALUES
('11111111-1111-1111-1111-111111111111', 'Carnicería San Juan', 'Pedro López', 'ventas@carniceriasanjuan.com', '+52-55-7777-8888', 'Mercado San Juan, Local 15'),
('11111111-1111-1111-1111-111111111111', 'Mariscos del Golfo', 'Ana Martínez', 'pedidos@mariscosdelgolfo.com', '+52-55-9999-0000', 'Central de Abastos, Nave 12'),
('11111111-1111-1111-1111-111111111111', 'Verduras Frescas SA', 'Luis Hernández', 'contacto@verdurasfrescas.mx', '+52-55-1234-5678', 'Xochimilco, Km 15');

-- Sample Inventory Items
INSERT INTO inventory_items (organization_id, name, unit, current_stock, min_stock, reorder_point, unit_cost) VALUES
('11111111-1111-1111-1111-111111111111', 'Carne de Cerdo (Pastor)', 'kg', 25.500, 5.000, 10.000, 125.00),
('11111111-1111-1111-1111-111111111111', 'Tortillas de Maíz', 'kg', 15.000, 3.000, 5.000, 18.00),
('11111111-1111-1111-1111-111111111111', 'Queso Oaxaca', 'kg', 8.250, 2.000, 4.000, 85.00),
('11111111-1111-1111-1111-111111111111', 'Camarón Mediano', 'kg', 12.000, 2.000, 5.000, 180.00),
('11111111-1111-1111-1111-111111111111', 'Aguacate', 'kg', 20.000, 5.000, 10.000, 45.00),
('11111111-1111-1111-1111-111111111111', 'Coca Cola 600ml', 'pcs', 48, 12, 24, 12.00),
('11111111-1111-1111-1111-111111111111', 'Cerveza Corona', 'pcs', 36, 12, 18, 18.50);

-- Sample Organization Settings
INSERT INTO organization_settings (organization_id, setting_key, setting_value) VALUES
('11111111-1111-1111-1111-111111111111', 'business_hours', '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}, "wednesday": {"open": "09:00", "close": "22:00"}, "thursday": {"open": "09:00", "close": "22:00"}, "friday": {"open": "09:00", "close": "23:00"}, "saturday": {"open": "08:00", "close": "23:00"}, "sunday": {"open": "08:00", "close": "21:00"}}'),
('11111111-1111-1111-1111-111111111111', 'receipt_footer', '"¡Gracias por visitarnos! Síguenos en redes sociales @ElSazonMexicano"'),
('11111111-1111-1111-1111-111111111111', 'auto_print_kitchen', 'true'),
('11111111-1111-1111-1111-111111111111', 'default_service_charge', '0.0000'),
('11111111-1111-1111-1111-111111111111', 'loyalty_program_enabled', 'true');

-- Sample Loyalty Program
INSERT INTO loyalty_programs (organization_id, name, description, points_per_dollar, dollars_per_point, min_points_redemption) VALUES
('11111111-1111-1111-1111-111111111111', 'Club Sazón', 'Programa de lealtad El Sazón Mexicano', 1.0000, 0.0100, 100);

-- Sample Promotion
INSERT INTO promotions (organization_id, name, description, type, scope, value, valid_from, valid_until, days_of_week) VALUES
('11111111-1111-1111-1111-111111111111', 'Descuento Martes de Tacos', '20% de descuento en todos los tacos los martes', 'percentage', 'category', 20.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', ARRAY[2]);

-- Sample Reservations
INSERT INTO reservations (organization_id, customer_id, table_id, confirmation_number, guest_name, guest_phone, party_size, reservation_date, reservation_time, status) VALUES
('11111111-1111-1111-1111-111111111111', 'cust2222-2222-2222-2222-222222222222', 'tab88888-8888-8888-8888-888888888888', 'RES-20250921-001', 'María Rodríguez', '+52-55-3333-4444', 8, '2025-09-22', '19:30:00', 'confirmed'),
('11111111-1111-1111-1111-111111111111', 'cust3333-3333-3333-3333-333333333333', 'tab33333-3333-3333-3333-333333333333', 'RES-20250921-002', 'Carlos García', '+52-55-5555-6666', 6, '2025-09-23', '20:00:00', 'pending');

-- Update table statuses based on current orders
UPDATE tables SET status = 'occupied' WHERE id IN (
    SELECT DISTINCT table_id FROM orders 
    WHERE status IN ('pending', 'confirmed', 'preparing', 'ready', 'served') 
    AND table_id IS NOT NULL
);

UPDATE tables SET status = 'reserved' WHERE id IN (
    SELECT DISTINCT table_id FROM reservations 
    WHERE status = 'confirmed' 
    AND reservation_date >= CURRENT_DATE 
    AND table_id IS NOT NULL
);

-- Create sequences for order numbers per organization
CREATE SEQUENCE IF NOT EXISTS "order_number_seq_11111111-1111-1111-1111-111111111111" START 4;