版本升级注意事项！！
- [升级注意事项！！](https://github.com/1657744680/obsidian-yaml-bulk-edit/issues/12)

> **此插件涉及到批量修改文档内容，所以使用前请进行数据备份！！使用此插件导致的任何数据丢失本人概不负责。**
>
> 请在使用前备份数据！！
>
> 请在使用前备份数据！！
>
> 请在使用前备份数据！！
>
> 当您误操作数据后，请使用命令`YAML Database: 还原上一步操作`来还原操作。

# 目录

* [目录](#目录)
* [obsidian\-yaml\-database 数据库](#obsidian-yaml-database-数据库)
* [安装](#安装)
* [使用](#使用)
  * [代码块：表格编辑YAML](#代码块表格编辑yaml)
    * [创建表格](#创建表格)
    * [操作区域](#操作区域)
    * [行操作与编辑](#行操作与编辑)
    * [过滤和排序](#过滤和排序)
    * [列宽与拖动](#列宽与拖动)
    * [数据表格配置信息存储（高级）](#数据表格配置信息存储高级)
  * [命令：还原上一步操作](#命令还原上一步操作)
  * [设置面板：管理渲染过的数据表格](#设置面板管理渲染过的数据表格)
* [感谢](#感谢)
* [版本更新日志](#版本更新日志)

# obsidian-yaml-database 数据库

> **此插件涉及到批量修改文档内容，所以使用前请进行数据备份！！使用此插件导致的任何数据丢失本人概不负责。**
>
> 请在使用前备份数据！！
>
> 请在使用前备份数据！！
>
> 请在使用前备份数据！！
>
> 当您误操作数据后，请使用命令`还原上一步操作`来还原操作。（仅支持对属性修改操作的还原）

> 此插件适用的人群：
>
> - 使用obsidian并懂得yaml的用户
> - 想体验类似于 notion 的 database 的用户（当然差很远的了😄）
>

---

插件的Github链接：[1657744680/obsidian-yaml-database: 像notion database一样浏览编辑文档的YAML属性 (github.com)](https://github.com/1657744680/obsidian-yaml-database)

> （老版本）0.7.0版本的演示视频：[obsidian-yaml-database：帮助您管理一个文件夹中的子文档YAML属性](https://www.bilibili.com/video/BV1M94y1d79D/)
>
> 注意：新版本为了提升体验，**改变了创建代码块的方式**，请自行阅读README文档

图片预览：

<img src="https://user-images.githubusercontent.com/39726621/162576433-4f8cede1-c487-401c-80e3-46e944f079ee.png" alt="image" width="700px" />



# 安装

1. 手动从release页面下载安装
2. 在obsidian中使用插件Brat输入`1657744680/obsidian-yaml-database`进行安装

# 使用

> 注意：**这个表格编辑YAML它是只能编辑一个文件夹下的”子“文档，意思就是这个文件夹的子文件夹下的文档并不会被索引。**

## 代码块：表格编辑YAML

### 创建表格

> 您只需要按照以下语法创建一个表格，然后就可以进行可视化操作了😄

创建表格的语法：

````text
```yamledit
输入一个id值
```
````

**一个独一无二的`id`对应一个数据表格的配置信息！！**

- 您创建的这个数据表格被渲染后，此表格会被保存到插件的`data.json`中，您在设置面板里可以看到您曾经渲染过哪些数据表格。
- 您可以在obsidian中创建 2 个或多个具有相同`id`值的数据表格，但是请注意它们是**共用**一套配置信息。
  - 这样的话若您已经创建了一个数据表格，您可以在另一处也创建一个和其共享一套配置的表格，只需要输入同样的`id`即可。
- 您如果希望创建 2 个使用不同配置信息的表格，那您就需要为它们创建 2 个独一无二的`id`

---

表格包含以下区域：

<img src="https://user-images.githubusercontent.com/39726621/162576595-059b1d36-6e36-49ed-a954-af2594a89a57.png" alt="image" width="500px" />

- 上方的操作区域：`新建`、`搜索`、`编辑列`、`表格设置`、`刷新`（后面3个按钮只在鼠标移动到操作区域才会显示）
- 下方的表格区域：表头可设置过滤器和排序、浏览编辑表格

上面我们已经创建了表格，接着我们继续进行表格的后续设置：

1. 创建表格后，表格初始会设置文件夹为根目录，点击`表格设置`→`选择文件夹`→输入选择文件夹以管理其中的文档。
1. 接下来您就可以开始管理选定文件夹下的子文档的YAML属性了🥳

---

### 操作区域

下面来详细介绍下操作区域：

1. `新建`：会在选定文件夹下新建未命名文档，您也可以为当前 database 选择模板文档（`表格设置`→`模板文件配置`）
2. `搜索`：会对文件路径及文件的所有yaml属性值进行搜索
3. `编辑列`：点击该按钮后，将鼠标移至表头的某一列并点击右键弹出菜单，操作完成后您可能需要点击`应用变更`来保存更改，现支持以下操作：<img src="https://user-images.githubusercontent.com/39726621/162576693-3a918216-ddbf-48ab-ae02-11be538c70d2.png" alt="image" width="500px" />
   1. `重命名显示名称`：为当前属性命设置显示名称，只是改变其在表格中的显示名称，这不会对属性本身造成影响
   2. `选择属性`：选择当前列要显示的属性
   3. `编辑属性`：您可以在这里看到表格支持的属性类型
      1. 编辑属性的类型、配置、显隐。（操作之后记得点击`应用变更`）
      2. **此外您可以且只能在这里删除该属性**。
   4. `重命名属性`：对当前属性重命名，这个就是对属性本身进行操作了
   5. `隐藏属性`：隐藏当前属性
   6. `添加属性`：在右边一列添加或显示属性
      1. 若输入的属性原本就存在，那么会将其添加到当前列的右侧
      2. 若输入的属性不存在，则为选定文件夹下的所有子文档创建新属性。
         注意：添加原本不存在的属性后，表格会重新渲染，您会注意到您刚才添加的属性并未显示在表格中，请手动再次添加即可。
4. `表格设置`：点击之后会打开面板，操作即可，记得操作完后点击`应用变更`<img src="https://user-images.githubusercontent.com/39726621/162576796-37ec7c06-cf1e-4657-9756-db2ca349558b.png" alt="image" width="500px" />
   1. `属性显隐控制`：控制属性的显示和隐藏
   2. `分页条目数量`：请输入数字，限制在`(0, 1000]`的区间内
   3. `选择文件夹`：设定当前表格管理的对应文件夹
   4. `模板文件配置`：新建的文档会以此为模板
5. `刷新`：重新读取缓存刷新表格

其它的注意事项：

2. 当您操作表格的某个单元格且输入改变值时，若该单元格所对应的文档没有该单元格所对应的属性，那么插件会自动为该文档**新建该属性**。
2. 对于多行的yaml属性，当您对它编辑并赋值时，插件会将文档中的它从多行变成单行，但这并不会有什么其它的影响。

---

### 行操作与编辑

支持以下操作：

- `双击单元格编辑`：为属性赋值（复选框类型的属性不可编辑）
- `右键 删除该文档`：这会删除文档至系统回收站或者本地
- `多选批量编辑某个属性值`：按住`Ctrl`或`Shift`的同时使用鼠标点击行进行多选，选好想要编辑的行之后，按住`Ctrl`不要松，用鼠标**双击**选中行里的某个单元格，接着输入修改即可。（这个单元格所在列应该是您想要编辑的属性）
- `文档命名`：也是支持的

---

### 过滤和排序

在`编辑列`未被触发的情况下，点击表头进行排序和过滤操作。（为了存储当前过滤和排序参数，表格会重新渲染，这会导致表格闪烁。）

过滤：

<img src="https://user-images.githubusercontent.com/39726621/162576976-02786e3c-bcee-4753-b0bb-d3f77e2b3c09.png" alt="image" width="500px" />

排序：（**多条件排序**：按住`Ctrl`点击表头即可）

<img src="https://user-images.githubusercontent.com/39726621/162577060-bf371025-0c00-4fdf-b7a1-1db35ef772bf.png" alt="image" width="500px" />

### 列宽与拖动

支持直接拖动列，也支持拖拽设置列的宽度。（为了存储当前参数，表格会重新渲染，这会导致表格闪烁。）

### 数据表格配置信息存储（高级）

- 所有`id`对应的数据表格的配置信息都存储在插件所在文件夹中的`data.json`数据是JSON字符串，它包含以下几个参数，在此说明以方便使用：<img src="https://user-images.githubusercontent.com/39726621/162576930-d194f5dd-6418-4b34-a38d-9436696f16f7.png" alt="image" width="300px" />
- `id`：当前库中独一无二的 id
- `paginationSize`：分页条数设置
- `folder`：文件夹路径
- `templatePath`：模板文档路径
- `colDef`：（插件自动生成，用于存储表格中列的有关信息）
- `filterModal`：（插件自动生成，用于存储表格中的过滤器信息）

> 可以看到，用户能够编辑的其实一般只有前4个。

---

## 命令：还原上一步操作

1. 当您误操作修改属性数据时可使用该命令回到上一步
2. 该命令仅对表格修改属性的操作生效，包括属性的增、删、改操作
3. 该命令仅存储50次过去的操作
4. 还原命令操作后，表格不会自动刷新，需要手动刷新！

---

## 设置面板：管理渲染过的数据表格

您创建的这个数据表格被渲染后，此表格会被保存到插件的`data.json`中，您在设置面板里可以看到您曾经渲染过哪些数据表格。

点击删除将会删除该`id`对应的数据表格的配置信息，此操作无法撤销！！

---

# 感谢

> 我不太会CSS，早期版本表格样式的代码是QQ群的`Cuman`老哥按我的要求帮忙提供的，感谢！！

> 之前的插件中的表格是纯手写的，在显示多条数据时有很大的性能问题，而且难以实现很多想要实现的复杂功能，于是开始重构代码，参考qq群里`峰华`老哥开发的[windily-cloud/obsidian-AGtable](https://github.com/windily-cloud/obsidian-AGtable)插件使用的[AG Grid](https://www.ag-grid.com/)，目前的表格使用体验比原本要好很多。

---

# 版本更新日志

## 0.7.2

### 增强

- [x] 改变代码逻辑，将数据表格的信息存储到data.json中而不是代码块，大幅减少了表格的重新渲染次数，提升操作体验
- [x] 对多个操作进行优化……

## 0.7.1

### 修复

- [x] 修复删除BUG

## 0.7.0

同时需要注意的是，此插件现在仅支持对一个文件夹的子文档的 yaml 属性进行管理。
（0.7.0版本以前是可以通过多种条件筛选，但是考虑到 yaml 的实际使用场景以及多条件筛选易造成的表格交叉管理同一文档属性的问题，故本插件以后的版本不在支持多种条件筛选）

### 增强

- [x] 使用 ag grid 重构代码，解决性能问题，优化表格编辑体验

## 0.6.1

### 增强

- [x] 文档名称单元格设置为双击编辑
- [x] yamledit添加新文档时，刚添加的文档会放在第一行以方便编辑

## 0.6.0

### 增强

- [x] 文件设置为可编辑，可为文档重命名
- [x] 为yamledit添加按钮`＋`，可用于在指定位置以指定模板创建新文档

## 0.5.3

### 修复

- [x] 修复yamledit点击筛选按钮后，已存在的筛选条件中的参数②被覆盖的bug
- [x] 修复yamledit点击属性按钮后添加属性时只出现一个输入框的bug

### 增强

- [x] yamledit无筛选条件不显示任何文件，设置筛选条件后才显示文件
- [x] 优化了yamledit表格某属性宽度过窄时输入框过大的问题
- [x] 优化了对于checkbox类型属性的排序

## 0.5.2

### 增强

- [x] yamledit代码块prop:部分代码格式重构，如果您使用过yamledit，请删除原本的表格以使插件正常工作！！
- [x] yamledit表格支持设置属性栏宽度

## 0.5.1

### 修复

- [x] 修复一点表格编辑yaml时属性命名的小错误

## 0.5.0

插件视频演示：https://www.bilibili.com/video/BV1wr4y1p7qz/

### 修复

- [x] 修复了表格操作筛选文档时属性值中含英文冒号解析条件出错的bug
- [x] 修复了yaml中含有一些特殊符号时的错误，解决措施：插件会自动为对yaml赋值的属性添加英文半角单引号，同时会将您输入的值中的英文半角单引号强制转为英文半角双引号

### 增强

- [x] 还原上一步操作（最多纪录50条操作数据，包括批量操作、表格编辑）
- [x] 增加了对多行属性的编辑方法，目前的方法是删除多行属性值写到单行属性中去
- [x] 为表格增加按键操作
  - [x] 刷新（点击重新读取缓存渲染表格）
  - [x] 搜索（只会对当前表格显示的内容进行搜索，对于checkbox类型的属性需要输入true或false来搜索）
  - [x] 属性（属性批量操作面板、属性显示控制、属性名称控制）
  - [x] 排序`↑↓`（按照指定的排序条件进行排序，支持多条件排序，支持对文件和各属性按asc或desc排序）
  - [x] 筛选（和批量操作筛选文档的条件相同）
- [x] 像notion那样，表格的属性是有类型的（注意，若您的属性值不符合您指定的属性类型，那么该值可能不会被显示！text类型可显示所有属性值）目前支持以下类型：
  - [x] text（默认）
  - [x] checkbox
  - [x] date
  - [x] time
  - [x] number
  - [x] img（仅支持在线图片）
  - [x] url
- [x] table中的td显示和input分开以更好的支持多类型数据

## 0.2.0

### 修复

- [x] 表格CSS与第三方主题冲突的问题 #2

### 增强

- [x] 去除表格编辑YAML时的文件名称的`.md`后缀
- [x] 支持多条件排序！

## 0.1.1

### 修复

- [x] 修复不识别yaml中tags、tag的bug

### 增强

- [x] 将设置项中的禁止删除和修改选项分为2项：①禁止批量操作的属性、②禁止表格操作的属性
- [x] 设置中的操作项均由text改为textarea以方便编写

## 0.1.0

### 增强

- [x] 支持代码块渲染为列表来编辑YAML
  新版本（包括表格编辑YAML功能）功能演示视频：[obsidian批量修改文档yaml属性插件新版本演示（表格编辑YAML！！）](https://www.bilibili.com/video/BV1yu411v7Ej/)
- [x] 设置项中添加选项：表格中隐藏的属性名称
- [x] 面板②增加操作：清理空值属性

## 0.0.3

### 增强

- [x] 支持筛选文档后进一步选择目标文档
- [x] 设置项中添加选项：忽略文件夹

## 0.0.2

### 修复
- [x] 修复`yaml属性`选择属性后搜索选框不显示全部已存在的属性值的问题
- [x] 修复未选择添加功能时自动添加`---`的问题
### 增强
- [x] 为面板③修改删除、修改属性操作的第一个输入框增加候选项
- [x] 面板②增加操作：删除整个yaml

## 0.0.1

视频演示：[obsidian批量修改文档yaml属性插件演示](https://www.bilibili.com/video/BV1pq4y1Y7as/)
