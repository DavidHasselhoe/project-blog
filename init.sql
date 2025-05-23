CREATE TABLE IF NOT EXISTS
    users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

CREATE TABLE IF NOT EXISTS
    posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

CREATE TABLE IF NOT EXISTS
    likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        liked_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

ALTER TABLE posts
ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE likes
ADD CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE likes
ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE;

ALTER TABLE likes
ADD CONSTRAINT likes_user_post_unique UNIQUE (user_id, post_id);

INSERT INTO
    users (username, email, password_hash)
VALUES
    ('admin', 'admin@example.com', 'admin') ON CONFLICT (email)
DO NOTHING;

INSERT INTO
    posts (user_id, title, content, created_at, updated_at)
VALUES
    (
        1,
        'Welcome to My Blog!',
        'This is my first blog post. I''m excited to share my thoughts and experiences with you all!',
        now(),
        now()
    );