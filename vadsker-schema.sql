--
-- PostgreSQL database dump
--

\restrict qOWcrssocvMbnOrT6Ip3o2CrhYOeJPwjG9xoHDj1Kb6r3lilAedku8xGJbAFd1J

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
    longitude numeric(9,6),
    userid integer
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash character varying(255)
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
-- Name: events events_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_userid_fkey FOREIGN KEY (userid) REFERENCES public.users(userid) ON DELETE SET NULL;


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

\unrestrict qOWcrssocvMbnOrT6Ip3o2CrhYOeJPwjG9xoHDj1Kb6r3lilAedku8xGJbAFd1J

