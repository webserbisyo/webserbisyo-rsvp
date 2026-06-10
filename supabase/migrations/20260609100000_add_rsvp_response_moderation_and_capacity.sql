-- Add review_status to rsvp_responses
ALTER TABLE public.rsvp_responses 
ADD COLUMN review_status text NOT NULL DEFAULT 'approved'
CONSTRAINT rsvp_responses_review_status_check 
CHECK (review_status = ANY (ARRAY['approved'::text, 'rejected'::text]));

-- Index for capacity counting and moderation filtering
CREATE INDEX rsvp_responses_event_id_review_status_attendance_status_idx 
ON public.rsvp_responses (event_id, review_status, attendance_status);

-- Comments
COMMENT ON COLUMN public.rsvp_responses.review_status IS 'Client/Admin moderation status of the RSVP response. "approved" is active, "rejected" is excluded from capacity.';

-- Function for transaction-safe RSVP submission with capacity check
CREATE OR REPLACE FUNCTION public.submit_rsvp_response_with_capacity_check(
    p_event_id UUID,
    p_client_id UUID,
    p_guest_name TEXT,
    p_email TEXT,
    p_phone TEXT,
    p_attendance_status TEXT,
    p_party_size INTEGER,
    p_dietary_notes TEXT,
    p_message TEXT,
    p_message_public_status TEXT,
    p_source TEXT
) RETURNS public.rsvp_responses AS $$
DECLARE
    v_max_guest_count INTEGER;
    v_current_total INTEGER;
    v_new_response public.rsvp_responses;
BEGIN
    -- Lock the event row for update to serialize capacity checks for this event
    SELECT COALESCE(max_guest_count, 1000) INTO v_max_guest_count
    FROM public.rsvp_events
    WHERE id = p_event_id
    FOR UPDATE;

    IF p_attendance_status = 'attending' THEN
        -- Sum up party_size for all approved attending responses
        SELECT COALESCE(SUM(party_size), 0) INTO v_current_total
        FROM public.rsvp_responses
        WHERE event_id = p_event_id
        AND attendance_status = 'attending'
        AND review_status = 'approved'
        AND archived_at IS NULL;

        IF v_current_total + p_party_size > v_max_guest_count THEN
            RAISE EXCEPTION 'CAPACITY_EXCEEDED';
        END IF;
    END IF;

    -- Insert the response
    INSERT INTO public.rsvp_responses (
        event_id, client_id, guest_name, email, phone, attendance_status, 
        party_size, dietary_notes, message, message_public_status, source, review_status
    ) VALUES (
        p_event_id, p_client_id, p_guest_name, p_email, p_phone, p_attendance_status, 
        p_party_size, p_dietary_notes, p_message, p_message_public_status, p_source, 'approved'
    ) RETURNING * INTO v_new_response;

    RETURN v_new_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for transaction-safe RSVP approval with capacity check
CREATE OR REPLACE FUNCTION public.approve_rsvp_response_with_capacity_check(
    p_response_id UUID,
    p_client_id UUID
) RETURNS public.rsvp_responses AS $$
DECLARE
    v_max_guest_count INTEGER;
    v_current_total INTEGER;
    v_response public.rsvp_responses;
BEGIN
    -- Lock the response row and get current data
    SELECT * INTO v_response
    FROM public.rsvp_responses
    WHERE id = p_response_id AND client_id = p_client_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'RESPONSE_NOT_FOUND';
    END IF;

    IF v_response.review_status = 'approved' THEN
        RETURN v_response;
    END IF;

    -- Lock the event row for capacity check
    SELECT COALESCE(max_guest_count, 1000) INTO v_max_guest_count
    FROM public.rsvp_events
    WHERE id = v_response.event_id
    FOR UPDATE;

    IF v_response.attendance_status = 'attending' THEN
        SELECT COALESCE(SUM(party_size), 0) INTO v_current_total
        FROM public.rsvp_responses
        WHERE event_id = v_response.event_id
        AND attendance_status = 'attending'
        AND review_status = 'approved'
        AND archived_at IS NULL;

        IF v_current_total + v_response.party_size > v_max_guest_count THEN
            RAISE EXCEPTION 'CAPACITY_EXCEEDED';
        END IF;
    END IF;

    UPDATE public.rsvp_responses
    SET review_status = 'approved', updated_at = timezone('utc'::text, now())
    WHERE id = p_response_id
    RETURNING * INTO v_response;

    RETURN v_response;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
