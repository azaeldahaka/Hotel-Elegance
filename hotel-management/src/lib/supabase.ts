import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://owrrayygkmxddyordial.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93cnJheXlna214ZGR5b3JkaWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5ODUxMTIsImV4cCI6MjA3NTU2MTExMn0.A-8KS7RwMyiTdKua-D6DNtZaP9tQ9nLK3EiIBacH0Tg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
