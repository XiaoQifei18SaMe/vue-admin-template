<template>
  <div class="student-management">
    <div class="page-header">
      <h2>学生管理</h2>
      <p>管理所有校区的学生信息</p>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchParams.name"
          placeholder="请输入学生姓名"
          style="width: 200px"
          clearable
        ></el-input>
        <el-select
          v-model="searchParams.schoolId"
          placeholder="选择校区"
          style="width: 200px; margin-left: 10px"
          clearable
        >
          <el-option
            v-for="school in schoolList"
            :key="school.id"
            :label="school.schoolname"
            :value="school.id"
          ></el-option>
        </el-select>
        <el-button
          type="primary"
          @click="handleSearch"
          style="margin-left: 10px"
        >
          搜索
        </el-button>
        <el-button
          @click="resetSearch"
          style="margin-left: 10px"
        >
          重置
        </el-button>
      </div>

      <el-table
        :data="studentList"
        border
        stripe
        :loading="loading"
        style="width: 100%; margin-top: 15px"
      >
        <el-table-column prop="id" label="学生ID" width="80" align="center"></el-table-column>
        <el-table-column prop="name" label="姓名" min-width="100"></el-table-column>
        <el-table-column prop="isMale" label="性别" width="80" align="center">
          <template #default="scope">{{ scope.row.isMale ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" align="center"></el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="130"></el-table-column>
        <el-table-column label="所属校区" min-width="150">
          <template #default="scope">{{ getSchoolName(scope.row.schoolId) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" style="margin-top: 15px; text-align: right">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.pageNum"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
        ></el-pagination>
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog
      title="编辑学生信息"
      :visible.sync="editDialogVisible"
      width="500px"
    >
      <el-form
        :model="formData"
        ref="form"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name" :rules="{ required: true, message: '请输入姓名', trigger: 'blur' }">
          <el-input v-model="formData.name"></el-input>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="formData.isMale">
            <el-radio :label="true">男</el-radio>
            <el-radio :label="false">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄" prop="age" :rules="{ type: 'number', min: 5, max: 100, message: '年龄在5-100之间', trigger: 'blur' }">
          <el-input v-model.number="formData.age" type="number"></el-input>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone" :rules="{ required: true, message: '请输入电话', trigger: 'blur' }">
          <el-input v-model="formData.phone"></el-input>
        </el-form-item>
        <el-form-item label="所属校区">
          <el-select v-model="formData.schoolId" placeholder="选择校区">
            <el-option
              v-for="school in schoolList"
              :key="school.id"
              :label="school.schoolname"
              :value="school.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getAllStudents, updateStudent, getSchools } from '@/api/super_admin'
import { Message } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'SuperAdminStudentManage',
  computed: {
    ...mapGetters(['token'])
  },
  data() {
    return {
      studentList: [],
      schoolList: [],
      loading: false,
      searchParams: {
        name: '',
        schoolId: '',
        pageNum: 1,
        pageSize: 10
      },
      pagination: {
        pageNum: 1,
        pageSize: 10,
        total: 0
      },
      editDialogVisible: false,
      formData: {
        isMale: true
      }
    }
  },
  created() {
    this.fetchSchools()
    this.fetchStudents()
  },
  methods: {
    // 根据schoolId获取校区名称
    getSchoolName(schoolId) {
      const school = this.schoolList.find(item => item.id === schoolId)
      return school ? school.schoolname : '未知校区'
    },
    async fetchSchools() {
      try {
        const res = await getSchools()
        this.schoolList = res.data || []
      } catch (err) {
        Message.error('获取校区列表失败')
      }
    },
    async fetchStudents() {
      this.loading = true
      try {
        const params = {
          ...this.searchParams,
          token: this.token
        }
        const res = await getAllStudents(params)
        this.studentList = res.data.content || []
        this.pagination = {
          pageNum: res.data.current,
          pageSize: res.data.size,
          total: res.data.total
        }
      } catch (err) {
        Message.error(err.message || '获取学生列表失败')
      } finally {
        this.loading = false
      }
    },
    handleSearch() {
      this.searchParams.pageNum = 1
      this.fetchStudents()
    },
    resetSearch() {
      this.searchParams = {
        name: '',
        schoolId: '',
        pageNum: 1,
        pageSize: 10
      }
      this.fetchStudents()
    },
    handleSizeChange(size) {
      this.searchParams.pageSize = size
      this.fetchStudents()
    },
    handleCurrentChange(page) {
      this.searchParams.pageNum = page
      this.fetchStudents()
    },
    handleEdit(row) {
      this.formData = { ...row }
      this.editDialogVisible = true
    },
    async submitEdit() {
      try {
        await updateStudent(this.token, this.formData)
        Message.success('更新成功')
        this.editDialogVisible = false
        this.fetchStudents()
      } catch (err) {
        Message.error(err.message || '更新失败')
      }
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
</style>