

create TABLE person (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) unique,
    password VARCHAR(255), 
    isActivated boolean default false,
    isActiveLink VARCHAR(255)
);

create TABLE token (
    user_id integer references person(id),
    refreshToken VARCHAR(255)
);