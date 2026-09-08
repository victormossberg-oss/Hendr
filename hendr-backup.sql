--
-- PostgreSQL database dump
--

\restrict aKP9C1TZA0GMIllvLGPkbxGei82TmRXMtYyQdorQFMLgRYWh4awQEG5sJZhgZOS

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.4 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: eventconfirmations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventconfirmations (
    confirmationid integer NOT NULL,
    eventid integer NOT NULL,
    userid integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.eventconfirmations OWNER TO postgres;

--
-- Name: eventconfirmations_confirmationid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventconfirmations_confirmationid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventconfirmations_confirmationid_seq OWNER TO postgres;

--
-- Name: eventconfirmations_confirmationid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventconfirmations_confirmationid_seq OWNED BY public.eventconfirmations.confirmationid;


--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.events (
    eventid integer NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    category character varying(50) NOT NULL,
    status character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    placeid integer,
    image_url text,
    latitude numeric(9,6),
    longitude numeric(9,6)
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: events_eventid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.events ALTER COLUMN eventid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.events_eventid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: observations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observations (
    observationid integer NOT NULL,
    userid integer,
    eventid integer,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image_url text,
    latitude numeric(9,6),
    longitude numeric(9,6)
);


ALTER TABLE public.observations OWNER TO postgres;

--
-- Name: observations_observationid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.observations ALTER COLUMN observationid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.observations_observationid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    placeid integer NOT NULL,
    latitude numeric(9,6) NOT NULL,
    longitude numeric(9,6) NOT NULL,
    address character varying(255),
    city character varying(100)
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: places_placeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.places ALTER COLUMN placeid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.places_placeid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    userid integer NOT NULL,
    username character varying(25) NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.users ALTER COLUMN userid ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_userid_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: eventconfirmations confirmationid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventconfirmations ALTER COLUMN confirmationid SET DEFAULT nextval('public.eventconfirmations_confirmationid_seq'::regclass);


--
-- Data for Name: eventconfirmations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventconfirmations (confirmationid, eventid, userid, created_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.events (eventid, title, description, category, status, created_at, placeid, image_url, latitude, longitude) FROM stdin;
14	Den här apan sitter här	Kom och kolla på den.	Nöje	Aktiv	2026-08-20 22:21:24.71926	\N	/uploads/1787257284705.avif	59.238983	18.099604
\.


--
-- Data for Name: observations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.observations (observationid, userid, eventid, description, created_at, image_url, latitude, longitude) FROM stdin;
18	1	14	Sjukt cool apa!	2026-08-20 22:23:00.406061	\N	\N	\N
\.


--
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (placeid, latitude, longitude, address, city) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (userid, username, email, created_at) FROM stdin;
1	Vicke	vicke@testmail.com	2026-08-14 13:54:05.522517
2	Carin	Carin@testmail.com	2026-08-14 13:57:07.71451
3	Stefano	dfgh@testmail.com	2026-08-14 13:57:07.71451
4	Mohammed	Mohammed@testmail.com	2026-08-14 13:57:07.71451
5	Victor	victor@testmail.com	2026-08-14 13:57:07.71451
\.


--
-- Name: eventconfirmations_confirmationid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventconfirmations_confirmationid_seq', 65, true);


--
-- Name: events_eventid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.events_eventid_seq', 14, true);


--
-- Name: observations_observationid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.observations_observationid_seq', 18, true);


--
-- Name: places_placeid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.places_placeid_seq', 1, false);


--
-- Name: users_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_userid_seq', 5, true);


--
-- Name: eventconfirmations eventconfirmations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventconfirmations
    ADD CONSTRAINT eventconfirmations_pkey PRIMARY KEY (confirmationid);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (eventid);


--
-- Name: observations observations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT observations_pkey PRIMARY KEY (observationid);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (placeid);


--
-- Name: eventconfirmations unique_event_user_confirmation; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventconfirmations
    ADD CONSTRAINT unique_event_user_confirmation UNIQUE (eventid, userid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (userid);


--
-- Name: events events_placeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_placeid_fkey FOREIGN KEY (placeid) REFERENCES public.places(placeid);


--
-- Name: eventconfirmations fk_confirmation_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventconfirmations
    ADD CONSTRAINT fk_confirmation_event FOREIGN KEY (eventid) REFERENCES public.events(eventid) ON DELETE CASCADE;


--
-- Name: eventconfirmations fk_confirmation_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventconfirmations
    ADD CONSTRAINT fk_confirmation_user FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE CASCADE;


--
-- Name: observations observations_eventid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT observations_eventid_fkey FOREIGN KEY (eventid) REFERENCES public.events(eventid);


--
-- Name: observations observations_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observations
    ADD CONSTRAINT observations_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid);


--
-- PostgreSQL database dump complete
--

\unrestrict aKP9C1TZA0GMIllvLGPkbxGei82TmRXMtYyQdorQFMLgRYWh4awQEG5sJZhgZOS

