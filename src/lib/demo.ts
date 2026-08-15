import { getCurrentUser, prisma } from "./db";
import { buildProjectContext } from "./context";
import { generateCharacters, generateSceneScreenplay, generateScenes, generateStoryBeats } from "./ai/service";
import { buildSceneHeading } from "./screenplay";

const DEMO_TITLE = "The Last Signal";

export async function createDemoProject() {
  const user = await getCurrentUser();

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: DEMO_TITLE,
      genre: "Sci-Fi Thriller",
      language: "English",
      format: "Feature Film",
      duration: 120,
      tone: "Dark, mysterious, emotional",
      reference: "Contact meets Prisoners",
      originalIdea:
        "A radio operator receives a distress signal from a spacecraft that disappeared 20 years ago.",
      logline:
        "When a lonely radio operator picks up a distress call from a spacecraft lost two decades ago, she must decide whether answering it will save the crew or finally expose what her own family did to strand them.",
      premise:
        "A remote listening station becomes the last link to a mission everyone agreed to forget, and the operator who hears it has to choose between the official story and the voices asking for help.",
      theme: "The truth is only useful to those prepared to pay for it.",
      ideaApproved: true,
    },
  });

  const context = await buildProjectContext(project.id);
  const characters = await generateCharacters(context, 4);
  await prisma.$transaction(
    characters.map((character) => prisma.character.create({ data: { ...character, projectId: project.id } })),
  );

  const beatContext = await buildProjectContext(project.id);
  const beats = await generateStoryBeats(beatContext);
  await prisma.$transaction(
    beats.map((beat, index) =>
      prisma.storyBeat.create({ data: { ...beat, order: index, projectId: project.id } }),
    ),
  );

  const savedBeats = await prisma.storyBeat.findMany({ where: { projectId: project.id }, orderBy: { order: "asc" } });
  let sceneNumber = 1;

  for (const beat of savedBeats.slice(0, 3)) {
    const sceneContext = await buildProjectContext(project.id);
    const scenes = await generateScenes(sceneContext, beat.title, 2);
    for (const scene of scenes) {
      const heading = buildSceneHeading(scene.intExt, scene.location, scene.timeOfDay);
      const screenplayContent = await generateSceneScreenplay(sceneContext, {
        heading,
        characters: scene.characters,
        purpose: scene.purpose,
        conflict: scene.conflict,
        summary: scene.summary,
      });
      await prisma.scene.create({
        data: {
          projectId: project.id,
          beatId: beat.id,
          sceneNumber: sceneNumber++,
          heading,
          screenplayContent,
          ...scene,
        },
      });
    }
  }

  return project;
}
