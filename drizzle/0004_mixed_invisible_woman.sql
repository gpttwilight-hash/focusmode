CREATE TABLE "active_timers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mode" text DEFAULT 'focus' NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"session_label" text DEFAULT '' NOT NULL,
	"planned_duration" integer DEFAULT 1500 NOT NULL,
	"active_elapsed_seconds" integer DEFAULT 0 NOT NULL,
	"session_started_at" timestamp with time zone,
	"run_started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"version" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "active_timers_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "active_timers" ADD CONSTRAINT "active_timers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;