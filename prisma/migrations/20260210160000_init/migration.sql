-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "transcript_status" AS ENUM ('processing', 'ready', 'error');

-- CreateEnum
CREATE TYPE "call_outcome" AS ENUM ('success', 'failure');

-- CreateEnum
CREATE TYPE "call_status" AS ENUM ('pending', 'extracting', 'aggregating', 'complete', 'error');

-- CreateTable
CREATE TABLE "transcripts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'audio_upload',
    "skip_transcription" BOOLEAN NOT NULL DEFAULT false,
    "imported_segments" JSONB,
    "import_metadata" JSONB,
    "durationSeconds" INTEGER,
    "wordTimestamps" JSONB,
    "language" TEXT,
    "quality_score" DOUBLE PRECISION,
    "word_count" INTEGER,
    "status" "transcript_status" NOT NULL DEFAULT 'processing',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "audio_format" TEXT,
    "audio_sample_rate" INTEGER,
    "audio_channels" INTEGER,
    "audio_bitrate" INTEGER,
    "whisper_segments" JSONB,
    "avg_confidence" DOUBLE PRECISION,
    "speech_ratio" DOUBLE PRECISION,
    "language_confidence" DOUBLE PRECISION,
    "diarization_segments" JSONB,
    "speaker_count" INTEGER,
    "nlu_results" JSONB,

    CONSTRAINT "transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "transcript_id" TEXT NOT NULL,
    "outcome" "call_outcome" NOT NULL,
    "backboard_thread_id" TEXT,
    "backboard_error" TEXT,
    "backboard_error_at" TIMESTAMP(3),
    "status" "call_status" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_signals" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "signal_type" TEXT NOT NULL,
    "signal_data" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "start_time" DOUBLE PRECISION NOT NULL,
    "end_time" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "call_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_aggregates" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "features" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_aggregates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbooks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "call_count" INTEGER NOT NULL,
    "confidence_scores" JSONB,
    "backboard_document_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_tags" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_notes" (
    "id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateIndex
CREATE INDEX "transcripts_user_id_idx" ON "transcripts"("user_id");

-- CreateIndex
CREATE INDEX "calls_user_id_idx" ON "calls"("user_id");

-- CreateIndex
CREATE INDEX "calls_transcript_id_idx" ON "calls"("transcript_id");

-- CreateIndex
CREATE INDEX "calls_outcome_status_idx" ON "calls"("outcome", "status");

-- CreateIndex
CREATE INDEX "call_signals_call_id_idx" ON "call_signals"("call_id");

-- CreateIndex
CREATE INDEX "call_aggregates_call_id_idx" ON "call_aggregates"("call_id");

-- CreateIndex
CREATE INDEX "playbooks_user_id_idx" ON "playbooks"("user_id");

-- CreateIndex
CREATE INDEX "call_tags_call_id_idx" ON "call_tags"("call_id");

-- CreateIndex
CREATE INDEX "call_tags_name_idx" ON "call_tags"("name");

-- CreateIndex
CREATE INDEX "call_notes_call_id_idx" ON "call_notes"("call_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_transcript_id_fkey" FOREIGN KEY ("transcript_id") REFERENCES "transcripts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_signals" ADD CONSTRAINT "call_signals_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_aggregates" ADD CONSTRAINT "call_aggregates_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_tags" ADD CONSTRAINT "call_tags_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_notes" ADD CONSTRAINT "call_notes_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
