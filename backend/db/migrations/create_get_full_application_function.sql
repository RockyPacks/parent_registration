-- Creates a function to get all data for a single application in one query.
-- This is to fix the N+1 problem in `EnrollmentRepository.get_full_application`.
CREATE
OR REPLACE FUNCTION get_full_application_data (p_application_id UUID) RETURNS JSON AS $$
  SELECT
    json_build_object(
      'id', a.id,
      'status', a.status,
      'created_at', a.created_at,
      'submitted_at', a.submitted_at,
      'user_id', a.user_id,
      'student', coalesce(json_agg(s) FILTER (WHERE s.id IS NOT NULL), '[]'::json) -> 0,
      'medical', coalesce(json_agg(m) FILTER (WHERE m.id IS NOT NULL), '[]'::json) -> 0,
      'family', coalesce(json_agg(f) FILTER (WHERE f.id IS NOT NULL), '[]'::json) -> 0,
      'fee', coalesce(json_agg(fr) FILTER (WHERE fr.id IS NOT NULL), '[]'::json) -> 0
    )
  FROM
    applications a
    LEFT JOIN students s ON a.id = s.application_id
    LEFT JOIN medical_info m ON a.id = m.application_id
    LEFT JOIN family_info f ON a.id = f.application_id
    LEFT JOIN fee_responsibility fr ON a.id = fr.application_id
  WHERE
    a.id = p_application_id
  GROUP BY
    a.id;
$$ LANGUAGE sql STABLE;
