DROP INDEX "unique_date_category";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_category_date" ON "dailylogs" USING btree ("user_id","category_id","date");