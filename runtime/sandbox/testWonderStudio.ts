import {
    wonderStudio,
  } from "@/studio";
  
  import type {
    WonderStudioGenerationRequest,
  } from "@/studio";
  
  const request: WonderStudioGenerationRequest = {
    id: "studio-coral-curiosity-001",
  
    createdAt: new Date(),
  
    contentType: "adventure",
  
    quantity: 1,
  
    language: "English",
  
    locale: "en-GB",
  
    friendId: "coral",
  
    worldId: "coral-world",
  
    valueId: "curiosity",
  
    templateId: "tiny-mystery",
  
    ageRange: {
      min: 4,
  
      max: 6,
    },
  
    difficulty: "easy",
  
    duration: 5,
  
    emotion: "wonder",
  
    location: "Treasure Cove",
  
    learningObjective:
      "Encourage children to observe carefully and ask curious questions.",
  
    creativeDirection:
      "A gentle underwater mystery involving a missing pearl light.",
  
    requiredWords: [
      "wonder",
      "discover",
      "together",
    ],
  
    bannedWords: [
      "scary",
      "dangerous",
    ],
  
    tags: [
      "ocean",
      "curiosity",
      "family",
      "offline-play",
    ],
  
    seed:
      "coral-curiosity-test-001",
  };
  
  const initialBatch =
    wonderStudio.createBatch(
      request
    );
  
  const prompt =
    wonderStudio.buildPromptForBatch(
      initialBatch
    );
  
  const generatedResponse = {
    batchId:
      initialBatch.id,
  
    contentType:
      "adventure",
  
    items: [
      {
        temporaryId:
          "missing-pearl-light",
  
        metadata: {
          friendId:
            "coral",
  
          worldId:
            "coral-world",
  
          valueId:
            "curiosity",
  
          templateId:
            "tiny-mystery",
  
          language:
            "English",
  
          locale:
            "en-GB",
  
          ageRange: {
            min: 4,
  
            max: 6,
          },
  
          difficulty:
            "easy",
  
          duration: 5,
  
          emotion:
            "wonder",
  
          location:
            "Treasure Cove",
  
          tags: [
            "ocean",
            "curiosity",
            "family",
            "offline-play",
          ],
        },
  
        story: {
          title:
            "The Missing Pearl Light",
  
          intro:
            "Coral swam into Treasure Cove and noticed that one tiny pearl light was no longer glowing.",
  
          problem:
            "Without the pearl light, the little fish could not find their favourite shell garden.",
  
          goal:
            "Coral asked the family to look closely, ask curious questions, and discover where the light had gone.",
  
          closing:
            "Together, they found the pearl beneath a soft blue leaf. Coral smiled and said that careful questions can lead to wonderful discoveries.",
        },
  
        mission: {
          title:
            "Build a Pearl Light Map",
  
          objective:
            "Practise curiosity by noticing small details and sharing ideas together.",
  
          activity:
            "Draw a simple treasure map on paper. Add three hiding places. Take turns asking questions and guessing where the pearl light is hidden.",
  
          successMessage:
            "Wonderful exploring! Your curious questions helped the family discover the pearl together.",
  
          supplies: [
            "Paper",
            "Crayons",
            "One small household object",
          ],
        },
      },
    ],
  };
  
  const ingestedBatch =
    wonderStudio.ingestGeneratedJSON(
      initialBatch,
      generatedResponse,
      {
        sourcePrompt:
          `${prompt.system}\n\n${prompt.user}`,
  
        sourceModel:
          "manual-studio-test",
      }
    );
  
  const validatedBatch =
    wonderStudio.validateBatch(
      ingestedBatch,
      {
        minimumOverallScore: 6,
  
        minimumCriticalScore: 6,
  
        requiredWords:
          request.requiredWords,
  
        bannedWords:
          request.bannedWords,
      }
    );
  
  const approvedBatch =
    wonderStudio.approveValidDrafts(
      validatedBatch
    );
  
  const importResult =
    wonderStudio.importBatch(
      approvedBatch,
      {
        destination:
          "sandbox-runtime-catalog",
  
        requireValidValidation:
          true,
  
        allowNeedsReview:
          false,
      }
    );
  
  const publication =
    wonderStudio.publishBatch(
      approvedBatch,
      {
        destination:
          "sandbox-runtime-catalog",
  
        requireValidValidation:
          true,
      },
      {
        name:
          "WonderLabs Sandbox Catalog",
  
        description:
          "End-to-end Wonder Studio test catalog.",
  
        version: 1,
  
        format:
          "json",
  
        requireCompleteImport:
          true,
  
        requireApprovedDrafts:
          true,
  
        destination:
          "sandbox-runtime-catalog",
  
        notes:
          "Generated during Wonder Studio end-to-end test.",
      }
    );
  
  const studioExport =
    wonderStudio.createExport(
      publication.publishResult,
      {
        format:
          "json",
      }
    );
  
  export const wonderStudioTest = {
    request,
  
    initialBatch,
  
    prompt,
  
    generatedResponse,
  
    ingestedBatch,
  
    validatedBatch,
  
    approvedBatch,
  
    importResult,
  
    publication,
  
    studioExport,
  };
  
  console.log(
    "Wonder Studio Test Summary",
    {
      batchId:
        approvedBatch.id,
  
      drafts:
        approvedBatch.drafts.length,
  
      valid:
        approvedBatch.totalValid,
  
      approved:
        approvedBatch.totalApproved,
  
      imported:
        importResult.totalImported,
  
      published:
        publication.publishResult.success,
  
      filename:
        studioExport.filename,
    }
  );
  
  console.log(
    studioExport.content
  );