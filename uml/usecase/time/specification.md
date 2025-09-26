# 时间触发的定时任务用例规约


## 1. 比赛管理相关定时任务

### 1.1 自动创建月赛（UC9_1）
| 项目 | 内容 |
|------|------|
| 用例编号 | UC9_1 |
| 用例名称 | 自动创建月赛 |
| 参与者 | 时间 |
| 前置条件 | 1. 系统已启用定时任务（`@EnableScheduling`注解生效）<br>2. 定时任务配置正确（`@Scheduled`的cron表达式有效，如每月1日0点或测试用特定时间） |
| 后置条件 | 1. 系统在`monthly_match`表新增当月月赛记录（`MonthlyMatchEntity`）<br>2. 月赛状态设为“未开始”（`NOT_STARTED`），并设置合理的开始时间和报名截止时间<br>3. 月赛记录包含标题（如“2025年9月乒乓球月赛”）、年份、月份等信息 |
| 基本流程 | 1. 到达定时任务触发时间（如每月1日0点或测试用`0 19 13 23 9 ?`）<br>2. 系统调用`MonthlyMatchService.createMonthlyMatch()`方法，获取当前时间<br>3. 计算月赛开始时间（如当月第四个周日9点，或测试用“触发时间+5分钟”）<br>4. 计算报名截止时间（如开始时间前7天，或测试用“开始时间-1分钟”）<br>5. 创建`MonthlyMatchEntity`对象并设置上述信息，通过`matchRepository.save(match)`保存至数据库 |
| 扩展流程 | 1. 数据库保存失败（如主键冲突）：系统记录异常日志，下次触发时重新尝试<br>2. 时间计算异常（如当月无第四个周日）：系统使用默认时间（如当月最后一个周日）并记录警告日志 |


### 1.2 自动安排赛程（UC9_2）
| 项目 | 内容 |
|------|------|
| 用例名称 | 自动安排赛程 |
| 用例编号 | UC9_2 |
| 参与者 | 时间 |
| 前置条件 | 1. 系统已启用定时任务（`@EnableScheduling`注解生效）<br>2. 存在状态为“报名中”（`REGISTERING`）或“报名截止”（`REGISTRATION_CLOSED`）且未安排赛程的月赛<br>3. 月赛的报名截止时间已过（`registrationDeadline.isBefore(now)`） |
| 后置条件 | 1. 目标月赛状态更新为“报名截止”（`REGISTRATION_CLOSED`）<br>2. 系统在`match_schedule`表新增赛程记录（`MatchScheduleEntity`），包含轮次、选手ID、球台ID、开始时间等信息<br>3. 月赛记录通过`matchRepository.save(match)`更新状态 |
| 基本流程 | 1. 到达定时任务触发时间（如每1分钟或每天凌晨，由`@Scheduled(cron = "0 */1 * * * ?")`配置）<br>2. 系统调用`MonthlyMatchService.arrangeMatchesAutomatically()`方法，查询符合条件的月赛（已截止报名且未安排赛程）<br>3. 对每个符合条件的月赛，调用`arrangeMatchSchedule(matchId)`生成具体赛程<br>4. 更新月赛状态为“报名截止”，并保存更新；同时保存赛程记录至数据库<br>5. 重复执行直至所有符合条件的月赛均完成赛程安排 |
| 扩展流程 | 1. 无符合条件的月赛：系统无操作，等待下次触发<br>2. 赛程生成失败（如报名人数不足）：系统记录异常日志，标记月赛为“赛程生成失败”并通知管理员 |


## 2. 课程管理相关定时任务

### 2.1 发送课程提醒（课前1小时）（UC10_1）
| 项目 | 内容 |
|------|------|
| 用例编号 | UC10_1 |
| 用例名称 | 发送课程提醒（课前1小时） |
| 参与者 | 时间 |
| 前置条件 | 1. 系统已启用定时任务<br>2. 存在状态为“已确认”（`CONFIRMED`）且1小时后开始的课程（`CourseAppointmentEntity`） |
| 后置条件 | 1. 课程关联的学员和教练收到提醒通知（通过`notificationService.createCourseReminderNotification`创建）<br>2. 通知记录保存至通知表，包含内容“您有一节课程将在1小时后开始，请做好准备” |
| 基本流程 | 1. 到达定时任务触发时间（隐含在定时检查逻辑中）<br>2. 系统调用`CourseEvaluationService.sendCourseReminders()`方法，识别1小时后开始的已确认课程<br>3. 对每门符合条件的课程，获取关联的学员ID和教练ID<br>4. 调用通知服务生成并发送提醒通知，包含课程开始时间、球台等信息<br>5. 记录通知发送状态（成功/失败） |
| 扩展流程 | 1. 通知发送失败（如用户未登录）：系统重试3次，仍失败则记录日志<br>2. 无符合条件的课程：系统无操作，等待下次触发 |


### 2.2 处理已结束课程并发送评价通知（UC10_2）
| 项目 | 内容 |
|------|------|
| 用例编号 | UC10_2 |
| 用例名称 | 处理已结束课程并发送评价通知 |
| 参与者 | 时间 |
| 前置条件 | 1. 系统已启用定时任务（`@Scheduled(cron = "0 */1 * * * ?")`配置生效）<br>2. 存在状态为“已确认”（`CONFIRMED`）且结束时间已过（`endTime.isBefore(now)`）的课程 |
| 后置条件 | 1. 课程状态更新为“已完成”（`COMPLETED`），并通过`appointmentRepository.save(course)`保存<br>2. 教练账户余额增加课程对应款项（通过`coachAccountService.addBalance`处理）<br>3. 系统在`course_payment_record`表新增教练收款记录<br>4. 学员和教练收到评价通知（通过`notificationService.createEvaluationNotification`创建） |
| 基本流程 | 1. 到达定时任务触发时间（每1分钟执行一次）<br>2. 系统调用`CourseEvaluationService.processCompletedCourses()`方法，查询所有已结束且状态为“已确认”的课程<br>3. 对每门课程：<br>   - 更新课程状态为“已完成”并保存<br>   - 若未给教练付款，调用教练账户服务添加课程对应金额，并创建收款记录<br>   - 调用通知服务向学员和教练发送评价通知（提示“课程已结束，可进行评价”）<br>4. 批量处理所有符合条件的课程 |
| 扩展流程 | 1. 教练账户不存在：系统自动调用`CoachAccountService.createCoachAccount(coachId)`创建账户后再执行付款<br>2. 付款失败（如并发冲突）：系统使用乐观锁重试，3次失败后标记为“待人工处理”并通知管理员 |