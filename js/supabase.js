import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// Өөрийн Supabase төслийн URL болон Anon Key-ийг энд оруулна.
const SUPABASE_URL = "https://sezbijdxftacfyrjaqfo.supabase.co" // Жишээ нь: "https://xyzcompany.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpamR4ZnRhY2Z5cmphcWZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NjgwMTQsImV4cCI6MjA5NjU0NDAxNH0.P2zukpBXLUXhFMW9ZV_k4t9Yd9vOzFA3BOvdg5IsQ1E" // Жишээ нь: "eyJhbGciOiJIUzI1NiIsInR5cCI6"

// Supabase клентийг үүсгэж, тогмол хувьсагчид хадгалах
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

if (supabase.auth) {
    console.log("Холбогдсон байна!")
    console.log(supabase.auth)
}