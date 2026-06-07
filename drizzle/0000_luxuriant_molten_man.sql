CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"workation_id" text NOT NULL,
	"paid_by_id" text NOT NULL,
	"description" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"receipt_image" "bytea",
	"receipt_mime_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_share" (
	"id" text PRIMARY KEY NOT NULL,
	"expense_id" text NOT NULL,
	"user_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"settled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "expense_share_unique" UNIQUE("expense_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "schedule_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"workation_id" text NOT NULL,
	"day" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"title" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"paypal_handle" text,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workation" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workation_member" (
	"id" text PRIMARY KEY NOT NULL,
	"workation_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'invited' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workation_member_unique" UNIQUE("workation_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_workation_id_workation_id_fk" FOREIGN KEY ("workation_id") REFERENCES "public"."workation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_paid_by_id_user_id_fk" FOREIGN KEY ("paid_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_share" ADD CONSTRAINT "expense_share_expense_id_expense_id_fk" FOREIGN KEY ("expense_id") REFERENCES "public"."expense"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_share" ADD CONSTRAINT "expense_share_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_entry" ADD CONSTRAINT "schedule_entry_workation_id_workation_id_fk" FOREIGN KEY ("workation_id") REFERENCES "public"."workation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workation" ADD CONSTRAINT "workation_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workation_member" ADD CONSTRAINT "workation_member_workation_id_workation_id_fk" FOREIGN KEY ("workation_id") REFERENCES "public"."workation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workation_member" ADD CONSTRAINT "workation_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;