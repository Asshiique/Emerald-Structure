import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import noticesRouter from "./notices";
import attendanceRouter from "./attendance";
import feesRouter from "./fees";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(noticesRouter);
router.use(attendanceRouter);
router.use(feesRouter);

export default router;
