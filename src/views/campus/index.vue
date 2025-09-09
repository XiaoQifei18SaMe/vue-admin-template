<template>
  <div class="campus-management">
    <div class="page-header">
      <h2>校区管理</h2>
      <el-button 
        type="primary" 
        @click="handleAdd" 
        v-if="isSuperAdmin"
      >
        <i class="el-icon-plus"></i> 新增校区
      </el-button>
    </div>

    <!-- 校区列表 -->
    <el-table
      :data="campusList"
      border
      stripe
      v-loading="listLoading"
      element-loading-text="加载中..."
      empty-text="暂无校区数据"
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column
        prop="id"
        label="ID"
        width="80"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="name"
        label="校区名称"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="location"
        label="地理位置"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="tableCount"
        label="球桌数量"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="admin.realName"
        label="管理员"
        align="center"
      ></el-table-column>
      <el-table-column
        prop="admin.phone"
        label="联系电话"
        align="center"
      ></el-table-column>
      <el-table-column
        label="操作"
        align="center"
        width="200"
      >
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="handleEdit(scope.row)"
            v-if="isSuperAdmin"
          >编辑</el-button>
          <el-button
            size="mini"
            type="danger"
            @click="handleDelete(scope.row)"
            v-if="isSuperAdmin"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[5, 10, 20]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      style="margin-top: 15px; text-align: right;"
    ></el-pagination>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="campusForm"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="校区名称" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item label="地理位置" prop="location">
          <el-input v-model="formData.location" />
        </el-form-item>
        <el-form-item label="球桌数量" prop="tableCount">
          <el-input 
            v-model="formData.tableCount" 
            type="number" 
            min="0"
          />
        </el-form-item>
        <el-form-item label="管理员" prop="adminId">
          <el-select v-model="formData.adminId" placeholder="选择管理员">
            <el-option
              v-for="admin in adminList"
              :key="admin.id"
              :label="admin.realName"
              :value="admin.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      title="确认删除"
      :visible.sync="deleteDialogVisible"
      width="300px"
      :close-on-click-modal="false"
    >
      <p>确定要删除 <span style="color: #f56c6c">{{ deleteCampusName }}</span> 吗？</p>
      <div slot="footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getCampusList, getAdminList, createCampus, updateCampus, deleteCampus } from '@/api/campus'
import { isSuperAdmin } from '@/utils/permission'  // 修正导入路径

export default {
  name: 'CampusManagement',
  data() {
    return {
      // 列表数据
      campusList: [],
      total: 0,
      currentPage: 1,
      pageSize: 10,
      listLoading: false,  // 新增加载状态
      
      // 弹窗状态
      dialogVisible: false,
      deleteDialogVisible: false,
      dialogTitle: '',
      currentCampusId: null,
      deleteCampusName: '',
      
      // 表单数据
      formData: {
        name: '',
        location: '',
        tableCount: 0,
        adminId: ''
      },
      
      // 表单验证规则
      formRules: {
        name: [
          { required: true, message: '请输入校区名称', trigger: 'blur' },
          { max: 50, message: '名称不能超过50个字符', trigger: 'blur' }
        ],
        location: [
          { required: true, message: '请输入地理位置', trigger: 'blur' }
        ],
        tableCount: [
          { required: true, message: '请输入球桌数量', trigger: 'blur' },
          { type: 'number', min: 0, message: '球桌数量不能为负数', trigger: 'blur', 
            transform(value) {
              return Number(value);//有bug，正数也会提示，可能是识别成字符串
            } 
          }
        ],
        adminId: [
          { required: true, message: '请选择管理员', trigger: 'change' }
        ]
      },
      
      // 管理员列表
      adminList: []
    }
  },
  computed: {
    // 判断是否为超级管理员（匹配 mock 中的 'super_admin' 角色）
    isSuperAdmin() {
       const role = this.$store.getters.role;
       const result = isSuperAdmin(role);
       console.log('角色:', role, '是否为超级管理员:', result); // 调试日志
       return result;
    }
  },
  watch: {
    // 弹窗关闭时清除表单验证
    dialogVisible(val) {
      if (!val) {
        this.$refs.campusForm?.clearValidate()
      }
    }
  },
  created() {
    this.fetchCampusList()
    this.fetchAdminList()
  },
  methods: {
    // 获取校区列表
    async fetchCampusList() {
      try {
        this.listLoading = true
        const response = await getCampusList({
          page: this.currentPage || 1,
          size: this.pageSize || 10
        })
        if (response.code === 20000) {
          this.campusList = response.data.items
          this.total = response.data.total
        } else {
          this.$message.error('获取数据失败：' + (response.message || '未知错误'))
        }
      } catch (error) {
        this.$message.error('获取校区列表失败')
        console.error(error)
      } finally {
        this.listLoading = false
      }
    },
    
    // 获取管理员列表
    async fetchAdminList() {
      try {
        const response = await getAdminList()
        if (response.code === 20000) {
          this.adminList = response.data
        } else {
          this.$message.error('获取管理员失败：' + (response.message || '未知错误'))
        }
      } catch (error) {
        this.$message.error('获取管理员列表失败')
        console.error(error)
      }
    },
    
    // 分页相关
    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchCampusList()
    },
    handleCurrentChange(page) {
      this.currentPage = page
      this.fetchCampusList()
    },
    
    // 新增校区
    handleAdd() {
      this.dialogTitle = '新增校区'
      this.currentCampusId = null
      this.formData = {
        name: '',
        location: '',
        tableCount: 0,
        adminId: ''
      }
      this.$nextTick(() => {
        this.$refs.campusForm.clearValidate()
      })
      this.dialogVisible = true
    },
    
    // 编辑校区
    handleEdit(row) {
  this.dialogTitle = '编辑校区'
  this.currentCampusId = row.id // 关键：直接用 row.id（Mock 生成的字符串 ID）
  this.formData = {
    name: row.name,
    location: row.location,
    tableCount: row.tableCount,
    adminId: row.admin.id // row.admin.id 是数字（与 adminList 一致）
  }
  this.$nextTick(() => {
    this.$refs.campusForm.clearValidate()
  })
  this.dialogVisible = true
},
    
    // 删除校区
    handleDelete(row) {
      this.deleteCampusName = row.name
      this.currentCampusId = row.id
      this.deleteDialogVisible = true
    },
    
    // 确认删除
    async confirmDelete() {
      try {
        const response = await deleteCampus(this.currentCampusId)
        if (response.code === 20000) {
          this.$message.success('删除成功')
          this.deleteDialogVisible = false
          this.fetchCampusList()
        } else {
          this.$message.error('删除失败：' + (response.message || '未知错误'))
        }
      } catch (error) {
        this.$message.error('删除失败')
        console.error(error)
      }
    },
    
    // 提交表单
    async handleSubmit() {
      this.$refs.campusForm.validate(async (valid) => {
        if (valid) {
          try {
            let response
            if (this.currentCampusId) {
              // 编辑操作
              response = await updateCampus(this.currentCampusId, this.formData)
            } else {
              // 新增操作
              response = await createCampus(this.formData)
            }
            if (response.code === 20000) {
              this.$message.success(this.currentCampusId ? '更新成功' : '创建成功')
              this.dialogVisible = false
              this.fetchCampusList()
            } else {
              this.$message.error((this.currentCampusId ? '更新失败' : '创建失败') + '：' + (response.message || '未知错误'))
            }
          } catch (error) {
            this.$message.error(this.currentCampusId ? '更新失败' : '创建失败')
            console.error(error)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>