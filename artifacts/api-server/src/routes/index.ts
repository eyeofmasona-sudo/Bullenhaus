import { Router, type IRouter } from "express";
import healthRouter from "./health";
import crmWorkersRouter from "./crm-workers";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/crm", crmWorkersRouter);

export default router;
