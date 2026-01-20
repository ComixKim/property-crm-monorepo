-- Add policy to allow admins, managers, and owners to update tickets
create policy "Admins update tickets" on "public"."tickets" as permissive for
update to public using (
        (
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE (
                        (profiles.id = auth.uid())
                        AND (
                            profiles.role = ANY (
                                ARRAY ['admin_uk'::user_role, 'manager'::user_role, 'owner'::user_role]
                            )
                        )
                    )
            )
        )
    ) with check (
        (
            EXISTS (
                SELECT 1
                FROM profiles
                WHERE (
                        (profiles.id = auth.uid())
                        AND (
                            profiles.role = ANY (
                                ARRAY ['admin_uk'::user_role, 'manager'::user_role, 'owner'::user_role]
                            )
                        )
                    )
            )
        )
    );