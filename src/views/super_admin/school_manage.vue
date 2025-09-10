<template>
  <div class="school-management">
    
    <el-card class="school-card">
      <div class="card-header">
        <el-button type="primary" @click="handleAdd">新增校区</el-button>
      </div>
      
      <el-table 
        :data="schoolList" 
        border 
        stripe 
        :loading="tableLoading"
        style="width: 100%; margin-top: 15px"
      >
        <el-table-column prop="id" label="校区ID" width="80" align="center"></el-table-column>
        <el-table-column prop="schoolname" label="校区名称" min-width="150"></el-table-column>
        <el-table-column prop="address" label="校区地址" min-width="200"></el-table-column>
        <el-table-column prop="name" label="联系人" min-width="120"></el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="130"></el-table-column>
        <el-table-column prop="table_num" label="球台数量" width="100" align="center"></el-table-column>
        <el-table-column prop="adminId" label="管理员ID" width="100" align="center"></el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleEdit(scope.row)"
              icon="Edit"
            >编辑</el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row)"
              icon="Delete"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 校区表单弹窗 -->
    <el-dialog 
      :title="dialogTitle" 
      :visible.sync="dialogVisible" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="schoolForm" 
        :model="formData" 
        :rules="formRules" 
        label-width="120px"
        class="school-form"
      >
        <el-form-item label="校区名称" prop="schoolname">
          <el-input v-model="formData.schoolname" placeholder="请输入校区名称"></el-input>
        </el-form-item>
        
        <el-form-item label="校区地址" prop="address">
          <el-input v-model="formData.address" placeholder="请输入校区详细地址"></el-input>
        </el-form-item>
        
        <el-form-item label="联系人" prop="name">
          <el-input v-model="formData.name" placeholder="请输入校区联系人"></el-input>
        </el-form-item>
        
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        
        <el-form-item label="联系邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入联系邮箱（选填）"></el-input>
        </el-form-item>
        
        <el-form-item label="球台数量" prop="table_num">
          <el-input 
            v-model.number="formData.table_num" 
            type="number" 
            min="1"
            placeholder="请输入球台数量"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="管理员ID" prop="adminId">
          <el-input 
            v-model.number="formData.adminId" 
            type="number" 
            min="1"
            placeholder="请输入负责该校区的管理员ID"
          ></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getSchools, createSchool, updateSchool, deleteSchool } from '@/api/super_admin'
import { validPhone } from '@/utils/validate'

export default {
  name: 'SchoolManagement',
  data() {
    const validatePhone = (rule, value, callback) => {
      if (value && !validPhone(value)) {
        callback(new Error('请输入正确的电话号码'))
      } else {
        callback()
      }
    }

    return {
      tableLoading: false,
      schoolList: [],
      dialogVisible: false,
      dialogTitle: '新增校区',
      formData: {
        id: null,
        schoolname: '',
        address: '',
        name: '',
        phone: '',
        email: '',
        table_num: 1,
        adminId: 1
      },
      formRules: {
        schoolname: [
          { required: true, message: '请输入校区名称', trigger: 'blur' },
          { max: 50, message: '校区名称最长50个字符', trigger: 'blur' }
        ],
        address: [
          { required: true, message: '请输入校区地址', trigger: 'blur' },
          { max: 200, message: '校区地址最长200个字符', trigger: 'blur' }
        ],
        name: [
          { required: true, message: '请输入联系人', trigger: 'blur' },
          { max: 20, message: '联系人姓名最长20个字符', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { validator: validatePhone, trigger: 'blur' }
        ],
        table_num: [
          { required: true, message: '请输入球台数量', trigger: 'blur' },
          { type: 'number', min: 1, message: '球台数量至少为1', trigger: 'blur' }
        ],
        adminId: [
          { required: true, message: '请输入管理员ID', trigger: 'blur' },
          { type: 'number', min: 1, message: '管理员ID必须为正整数', trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchSchools()
  },
  methods: {
    handleBack() {
      this.$router.go(-1)
    },

    // 获取所有校区列表
    async fetchSchools() {
      this.tableLoading = true
      try {
        const response = await getSchools()
        if (response.code === 20000) {
          this.schoolList = response.data
        } else {
          this.$message.error(`获取校区列表失败：${response.message}`)
        }
      } catch (error) {
        this.$message.error('获取校区列表失败，请稍后重试')
        console.error('获取校区列表错误：', error)
      } finally {
        this.tableLoading = false
      }
    },

    // 打开新增弹窗
    handleAdd() {
      this.dialogTitle = '新增校区'
      this.formData = {
        id: null,
        schoolname: '',
        address: '',
        name: '',
        phone: '',
        email: '',
        table_num: 1,
        adminId: 1
      }
      this.dialogVisible = true
      // 使用$nextTick等待DOM更新后再重置表单
      this.$nextTick(() => {
        this.$refs.schoolForm.resetFields()
      })
    },

    // 打开编辑弹窗
    handleEdit(row) {
      this.dialogTitle = '编辑校区'
      this.formData = { ...row }
      this.dialogVisible = true
    },

    // 提交表单（新增/更新）
    async submitForm() {
      this.$refs.schoolForm.validate(async (valid) => {
        if (valid) {
          try {
            let response
            if (this.formData.id) {
              // 更新校区
              response = await updateSchool(this.formData)
            } else {
              // 新增校区
              response = await createSchool({
                name: this.formData.name,
                location: this.formData.address,
                tableCount: this.formData.table_num,
                adminId: this.formData.adminId,
                schoolname: this.formData.schoolname,
                phone: this.formData.phone,
                email: this.formData.email
              })
            }

            if (response.code === 20000) {
              this.$message.success(this.formData.id ? '校区更新成功' : '校区创建成功')
              this.dialogVisible = false
              this.fetchSchools() // 刷新列表
            } else {
              this.$message.error(`${this.formData.id ? '更新' : '创建'}失败：${response.message}`)
            }
          } catch (error) {
            this.$message.error(`${this.formData.id ? '更新' : '创建'}校区失败，请稍后重试`)
            console.error('校区操作错误：', error)
          }
        }
      })
    },

    // 删除校区
    async handleDelete(row) {
      this.$confirm(`确定要删除校区【${row.schoolname}】吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deleteSchool(row.id)
          if (response.code === 20000) {
            this.$message.success('校区删除成功')
            this.fetchSchools() // 刷新列表
          } else {
            this.$message.error(`删除失败：${response.message}`)
          }
        } catch (error) {
          this.$message.error('删除校区失败，请稍后重试')
          console.error('删除校区错误：', error)
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    }
  }
}
</script>

<style scoped>
.school-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.school-card {
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px 0;
}

.school-form {
  margin-top: 15px;
}

.el-form-item {
  margin-bottom: 18px;
}
</style>