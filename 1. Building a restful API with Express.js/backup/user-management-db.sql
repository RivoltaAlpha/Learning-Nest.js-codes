-- Database Backup

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id text,
    name text,
    email text,
    age integer,
    avatar text,
    created_at timestamp without time zone
);

-- Data for table: users
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('0dc0a11c-47c3-44e1-9da2-19fe912506ad', 'Claudia Schroeder', 'Krista40@hotmail.com', 75, 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/80.jpg', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('cf28ab10-5413-48f7-b9d0-b145f5845862', 'Noah Krajcik', 'Gabriel.McKenzie86@hotmail.com', 18, 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/4.jpg', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('d369818f-85db-49e2-90a2-ef9dcd6d5645', 'Mr. Shane Rippin', 'Francisca_Graham@gmail.com', 70, 'https://avatars.githubusercontent.com/u/31645369', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('567ff3a9-05fd-4bbe-b5ad-1b40dceabef2', 'Louis Bogisich V', 'Maye78@hotmail.com', 45, 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/86.jpg', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('d49d9a9f-982b-4d13-bc20-d4ca827ebbc5', 'Lionel Kunde', 'Mac.Brekke@gmail.com', 36, 'https://avatars.githubusercontent.com/u/74934508', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('b3de1724-dc6d-4f8e-bb1d-955a2c49bede', 'Dr. Charlie Zieme', 'Laurence.Pollich@yahoo.com', 26, 'https://avatars.githubusercontent.com/u/97989757', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('f7c27eea-835d-4803-bfdd-d0981c5ce697', 'Roxanne Reichel', 'Joany.Oberbrunner@hotmail.com', 29, 'https://avatars.githubusercontent.com/u/23600211', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('00252d76-6949-4bc5-9ff4-e62997950358', 'Kenny Jacobi', 'Gerson_Lesch16@hotmail.com', 71, 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/female/512/51.jpg', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('1e6afb5e-e325-402c-acb4-c6a2c09897e8', 'Clifford Senger', 'Sebastian93@yahoo.com', 68, 'https://avatars.githubusercontent.com/u/14402678', '2025-05-22T09:31:05.508Z');
INSERT INTO users (id, name, email, age, avatar, created_at) VALUES ('77e8f8ff-8a67-4d5c-aaee-4b12bb7d1849', 'Kayla Lesch', 'Lamar62@gmail.com', 79, 'https://cdn.jsdelivr.net/gh/faker-js/assets-person-portrait/male/512/34.jpg', '2025-05-22T09:31:05.508Z');

-- Table: products
CREATE TABLE IF NOT EXISTS products (
    id text,
    name text,
    description text,
    price real,
    category text,
    stock integer,
    created_at timestamp without time zone
);

-- Data for table: products
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('ce563908-4fb0-498a-8b4c-b284ea6676f1', 'Product 1', 'Description for product 1', 747, 'Clothing', 18, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('c10334bf-8fcc-494d-b0e0-fa816cfc3c56', 'Product 2', 'Description for product 2', 646, 'Food', 52, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('81dbe3c0-c168-4f4c-b850-b71f8b28dbdf', 'Product 3', 'Description for product 3', 683, 'Home', 1, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('e31b57da-f746-4be2-b68c-8010c00a50fb', 'Product 4', 'Description for product 4', 246, 'Food', 45, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('e128e9bc-014a-4772-bb3f-9d6fe929a797', 'Product 5', 'Description for product 5', 197, 'Home', 34, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('1befcd8e-266b-439c-bb9c-c137de2cc3fa', 'Product 6', 'Description for product 6', 981, 'Home', 16, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('a48d806d-c1ec-4697-af52-cc4195a77d59', 'Product 7', 'Description for product 7', 373, 'Electronics', 32, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('a7f55252-eee9-4e3b-8be7-ffd929efba7f', 'Product 8', 'Description for product 8', 559, 'Food', 33, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('ec3f94eb-4548-4d5d-988f-1ba46c7a0cc9', 'Product 9', 'Description for product 9', 80, 'Food', 37, '2025-05-22T09:31:05.530Z');
INSERT INTO products (id, name, description, price, category, stock, created_at) VALUES ('31587629-4b73-4ffc-b634-35cc4eedf579', 'Product 10', 'Description for product 10', 843, 'Books', 22, '2025-05-22T09:31:05.530Z');

