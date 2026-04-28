import { generateQuestionPaper } from "../services/paperService.js";
import { generatePaperPDF } from "../services/pdfService.js";
import GeneratedPaper from "../models/GeneratedPaper.js";
import fs from "fs";
import { buildClassMatcher, normalizeClassLabel } from "../utils/classUtils.js";

export async function generatePaper(req, res) {
  try {
    const {
      subject,
      class: rawStdClass,
      exam_type,
      chapters,
      total_marks,
      num_questions,
      duration,
    } = req.body;
    const stdClass = normalizeClassLabel(rawStdClass);

    if (!subject || !stdClass || !exam_type || !chapters) {
      return res.status(400).json({
        success: false,
        message: "subject, class, exam_type, chapters required",
      });
    }

    console.log(`Generating ${exam_type} paper - ${subject} ${stdClass}`);

    const paperData = await generateQuestionPaper({
      subject,
      class: stdClass,
      exam_type,
      chapters,
      total_marks: total_marks ? parseInt(total_marks, 10) : undefined,
      num_questions: num_questions ? parseInt(num_questions, 10) : undefined,
      duration,
    });

    const paperInfo = paperData.paper_info || {};
    const chaptersToStore = Array.isArray(paperInfo.chapters_covered)
      ? paperInfo.chapters_covered
      : Array.isArray(chapters)
        ? chapters
        : [];
    const effectiveTotalMarks =
      Number(paperInfo.total_marks) || (total_marks ? parseInt(total_marks, 10) : 0);
    const effectiveNumQuestions =
      Number(paperInfo.num_questions) ||
      (Array.isArray(paperData.questions) ? paperData.questions.length : 0) ||
      (num_questions ? parseInt(num_questions, 10) : 0);
    const effectiveFormat = "pdf";

    const generatedPaper = new GeneratedPaper({
      title: `${paperInfo.subject || subject} - ${paperInfo.exam_type || exam_type}`,
      subject: paperInfo.subject || subject,
      exam_type: paperInfo.exam_type || exam_type,
      class: normalizeClassLabel(paperInfo.class || stdClass),
      chapters: chaptersToStore,
      total_marks: effectiveTotalMarks,
      num_questions: effectiveNumQuestions,
      duration: paperInfo.duration || duration,
      format: effectiveFormat,
      questions: paperData.questions || [],
      created_by: "teacher",
    });

    const savedPaper = await generatedPaper.save();
    console.log("Paper saved to database:", savedPaper._id);

    const responsePaperData = {
      ...paperData,
      paper_info: {
        ...paperInfo,
        subject: generatedPaper.subject,
        class: generatedPaper.class,
        exam_type: generatedPaper.exam_type,
        total_marks: generatedPaper.total_marks,
        num_questions: generatedPaper.num_questions,
        duration: generatedPaper.duration,
        format: generatedPaper.format,
        chapters_covered: generatedPaper.chapters,
      },
    };

    return res.status(200).json({
      success: true,
      format: generatedPaper.format,
      paperId: savedPaper._id,
      downloadUrl: `/api/papers/${savedPaper._id}/download`,
      data: responsePaperData,
    });
  } catch (error) {
    console.error("Error in generatePaper:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getAllPapers(req, res) {
  try {
    const papers = await GeneratedPaper.find()
      .sort({ created_at: -1 })
      .limit(20)
      .select(
        "_id title subject exam_type class total_marks num_questions duration format created_at",
      );

    return res.status(200).json({
      success: true,
      data: papers.map(serializePaperSummary),
    });
  } catch (error) {
    console.error("Error fetching papers:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getPaperById(req, res) {
  try {
    const { paperId } = req.params;

    const paper = await GeneratedPaper.findById(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Paper not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...paper.toObject(),
        class: normalizeClassLabel(paper.class) || paper.class,
      },
    });
  } catch (error) {
    console.error("Error fetching paper:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function getPapersByClass(req, res) {
  try {
    const { stdClass } = req.params;
    const classMatcher = buildClassMatcher(stdClass);

    const papers = await GeneratedPaper.find(
      classMatcher ? { class: classMatcher } : {},
    )
      .sort({ created_at: -1 })
      .select(
        "_id title subject exam_type class total_marks num_questions duration format created_at",
      );

    return res.status(200).json({
      success: true,
      data: papers.map(serializePaperSummary),
    });
  } catch (error) {
    console.error("Error fetching papers by class:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

export async function downloadPaper(req, res) {
  try {
    const { paperId } = req.params;

    const paper = await GeneratedPaper.findById(paperId);

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: "Paper not found",
      });
    }

    const paperData = {
      paper_info: {
        exam_type: paper.exam_type,
        subject: paper.subject,
        class: normalizeClassLabel(paper.class) || paper.class,
        chapters: paper.chapters,
        total_marks: paper.total_marks,
        duration: paper.duration,
        chapters_covered: paper.chapters,
      },
      questions: paper.questions,
    };

    console.log(`Generating PDF for paper: ${paper.title}`);

    const { filePath, fileName } = await generatePaperPDF(paperData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      try {
        fs.unlinkSync(filePath);
        console.log("Temp PDF deleted after download.");
      } catch (err) {
        console.error("Error deleting temp PDF:", err);
      }
    });
  } catch (error) {
    console.error("Error downloading paper:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

function serializePaperSummary(paper) {
  const serializedPaper = typeof paper.toObject === "function" ? paper.toObject() : paper;

  return {
    ...serializedPaper,
    class: normalizeClassLabel(paper.class) || paper.class,
  };
}
