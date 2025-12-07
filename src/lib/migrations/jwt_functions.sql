-- Create or replace the set_jwt_context function
CREATE OR REPLACE FUNCTION set_jwt_context(jwt_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
BEGIN
  -- Decode the JWT token payload (second part)
  -- JWT format: header.payload.signature
  claims := (
    SELECT jsonb_build_object(
      'userID', (current_setting('request.jwt.claims', true)::json->>'userID')::text,
      'name', (current_setting('request.jwt.claims', true)::json->>'name')::text,
      'iat', (current_setting('request.jwt.claims', true)::json->>'iat')::bigint
    )
  );
  
  -- Set the JWT claims in the request context
  PERFORM set_config('request.jwt.claims', claims::text, true);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_jwt_context(text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(text, text, boolean) TO authenticated; 