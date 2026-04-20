// @ts-ignore (Deno runtime context)
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // 1. CORS Preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase configuration");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let data;
        try {
            data = await req.json();
            console.log("RevenueCat Event Body:", JSON.stringify(data, null, 2));
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // RevenueCat sends the event data inside event
        const event = data.event;
        if (!event) {
             return new Response(JSON.stringify({ error: 'Missing event payload' }), { status: 400 });
        }

        const eventType = event.type; // e.g. RENEWAL, INITIAL_PURCHASE, NON_RENEWING_PURCHASE
        const appUserId = event.app_user_id;

        if (!appUserId) {
            return new Response(JSON.stringify({ error: 'Missing app_user_id' }), { status: 400 });
        }

        console.log(`Processing ${eventType} for User: ${appUserId}`);

        // --- Business Logic for Tokens ---
        
        // 1. Handle Subscription Purchase/Renewal
        if (eventType === "INITIAL_PURCHASE" || eventType === "RENEWAL") {
            // Subscription means resetting sub_stars back up to 100
            // Since this runs in Service Role context, RLS is bypassed.
            const { error: resetErr } = await supabase
                .from('profiles')
                .update({ sub_stars: 100 })
                .eq('id', appUserId);
            
            if (resetErr) throw resetErr;

            // Optional: Re-sync the generated/virtual tokens sum
            await syncTotalTokens(supabase, appUserId);
            
            return new Response(JSON.stringify({ success: true, action: "sub_stars_reset" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 2. Handle Consumable (Single-time purchases)
        if (eventType === "NON_RENEWING_PURCHASE") {
            // Increment bonus_stars by 100 (Assuming product id correlates to 100 stars)
            // You can branch logic here based on `event.product_id` if you have multiple star packages!
            const addedStars = 100;
            
            // To safely increment, we can fetch, then load, OR call an RPC.
            // Edge Function Service Roles can hit the DB securely.
            // We'll call the RPC we made earlier (Note: the RPC checks auth.uid(), so if RLS is bypassed, we still want to avoid RPC limits or just write a service-role variant).
            // Actually, let's just fetch and increment natively since we have Service Role.
            const { data: prof, error: getErr } = await supabase.from('profiles').select('bonus_stars').eq('id', appUserId).single();
            if (getErr) throw getErr;

            const newBonus = (prof.bonus_stars || 0) + addedStars;
            const { error: setErr } = await supabase.from('profiles').update({ bonus_stars: newBonus }).eq('id', appUserId);
            if (setErr) throw setErr;

            await syncTotalTokens(supabase, appUserId);

            return new Response(JSON.stringify({ success: true, action: "bonus_stars_added" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // Other events (like CANCELLATION) don't strictly require immediate action on tokens usually,
        // since the user keeps tokens until the period ends natively.
        return new Response(JSON.stringify({ success: true, message: "ignored_event_type" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err: any) {
        console.error("Function error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

// Helper to keep the legacy `tokens` column accurately matching the sum of both pools.
async function syncTotalTokens(supabase: any, userId: string) {
    const { data } = await supabase.from('profiles').select('sub_stars, bonus_stars').eq('id', userId).single();
    if (data) {
        const total = (data.sub_stars || 0) + (data.bonus_stars || 0);
        await supabase.from('profiles').update({ tokens: total }).eq('id', userId);
    }
}
