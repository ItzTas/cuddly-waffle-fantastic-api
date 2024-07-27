-- up
CREATE TABLE users (
	id 		   uuid PRIMARY KEY,
	real_name  TEXT NOT NULL,
	user_name  TEXT NOT NULL UNIQUE,
	email      TEXT NOT NULL UNIQUE,
	password   TEXT NOT NULL,   
	salt 	   TEXT NOT NULL,
	created_at TIMESTAMP NOT NULL,
	updated_at TIMESTAMP NOT NULL,
	CONSTRAINT chk_email_format
	CHECK (email LIKE '%@%')
);