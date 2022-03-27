# obsidian-yaml-bulk-edit 批量编辑yaml

## 此插件涉及到批量修改文档内容，所以使用前请进行数据备份！！

## 使用此插件导致的任何数据丢失本人概不负责。

这个插件是用来批量编辑obsidian中文档的yaml的。

支持：

1. `添加新属性`
2. `修改属性名`
3. `修改属性值`
4. `删除属性`

# 安装

手动从release页面下载安装

# 使用方法

1. 输入条件筛选文档
2. 确认筛选的文档和自己想要修改的目标文档一致
3. 选择操作
4. 输入参数
5. 修改完成

## 具体操作

1. Ctrl+P调出命令面板，选择命令`YAML属性批量管理: 打开操作面板`
2. 点击命令后进入**面板①**，在这里输入条件以筛选文档，可以添加新的条件（注意：各个条件之间为与关系），输入完成后确定。目前支持以下几种条件：
   1. `yaml`——`包含/不包含`——`属性名`
   2. `yaml属性`——`属性名`——`属性值`
   3. `标签`——`包含/不包含`——`标签名`
   4. `文件名称`——`符合/不符合`——`正则表达式`
   5. `文件路径`——`符合/不符合`——`正则表达式`
![image](https://user-images.githubusercontent.com/39726621/160273310-6ac1ec25-ee74-430e-bc2d-901ca57b047d.png)
3. 点击确定后进入到**面板②**，这里会展示筛选的文档，当您确认文档符合要求后可选择具体操作进行下一步。可选择的操作有：
   1. `添加新属性`
   2. `修改属性名`
   3. `修改属性值`
   4. `删除属性`
![image](https://user-images.githubusercontent.com/39726621/160273268-1afe5a41-9756-4cbc-8aa5-b11c9fa170ef.png)
4. 点击具体操作后进入到**面板③**，在这里输入值来进行最后一步的操作。请谨慎操作！！确认输入无误后点击确定即可提交。
![image](https://user-images.githubusercontent.com/39726621/160273284-614702eb-bc59-4dfc-937a-3f55a799c1e0.png)
5. 到这里就完成批量修改操作了。
6. 对于十分重要的yaml属性值，为了避免对这些重要的属性值造成误删、误改，可以将他们添加到设置页面的`禁止删除和修改的属性名称`中，多个属性值之间以英文半角逗号`,`隔开。例如`ctime,mtime`

