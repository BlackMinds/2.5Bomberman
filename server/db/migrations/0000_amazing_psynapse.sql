CREATE TABLE IF NOT EXISTS "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"exp" integer DEFAULT 0 NOT NULL,
	"free_points" integer DEFAULT 0 NOT NULL,
	"stat_damage" integer DEFAULT 20 NOT NULL,
	"stat_hp" integer DEFAULT 100 NOT NULL,
	"stat_speed" numeric(4, 1) DEFAULT '3.0' NOT NULL,
	CONSTRAINT "characters_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"bomb_type" varchar(50) DEFAULT 'normal' NOT NULL,
	"clothes_type" varchar(50) DEFAULT 'cloth' NOT NULL,
	"shoes_type" varchar(50) DEFAULT 'sandals' NOT NULL,
	CONSTRAINT "equipment_character_id_unique" UNIQUE("character_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "match_players" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kills" integer DEFAULT 0 NOT NULL,
	"survived" boolean DEFAULT false NOT NULL,
	CONSTRAINT "match_players_match_id_user_id_pk" PRIMARY KEY("match_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" varchar(20) NOT NULL,
	"winner_id" uuid,
	"duration" integer,
	"map_id" varchar(50),
	"played_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stage_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"character_id" uuid NOT NULL,
	"stage_id" integer NOT NULL,
	"best_time" integer,
	"cleared_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stage_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"partner_id" uuid,
	"kills" integer DEFAULT 0 NOT NULL,
	"duration" integer NOT NULL,
	"exp_gained" integer DEFAULT 0 NOT NULL,
	"drop_item" varchar(50),
	"played_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "equipment" ADD CONSTRAINT "equipment_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_players" ADD CONSTRAINT "match_players_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "match_players" ADD CONSTRAINT "match_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stage_progress" ADD CONSTRAINT "stage_progress_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stage_records" ADD CONSTRAINT "stage_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stage_records" ADD CONSTRAINT "stage_records_partner_id_users_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
