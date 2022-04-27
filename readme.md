[升级注意事项！！](https://github.com/1657744680/obsidian-yaml-bulk-edit/issues/12)

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
    * [表格的创建与简介](#表格的创建与简介)
    * [操作区域](#操作区域)
    * [行操作与编辑](#行操作与编辑)
    * [过滤和排序](#过滤和排序)
    * [列宽与拖动](#列宽与拖动)
    * [支持的属性类型](#支持的属性类型)
    * [Formula属性（高级）](#Formula属性高级)
    * [数据表格配置信息存储（高级）](#数据表格配置信息存储高级)
  * [命令：还原上一步操作](#命令还原上一步操作)
  * [设置面板：管理渲染过的数据表格](#设置面板管理渲染过的数据表格)
    * [配置信息存储位置](#配置信息存储位置)
    * [删除某个id数据表格的配置信息](#删除某个id数据表格的配置信息)
* [已知冲突](#已知冲突)
* [感谢](#感谢)
* [版本更新日志](#版本更新日志)

# obsidian-yaml-database 数据库

> 此插件适用的人群：
>
> - 使用obsidian并懂得yaml的用户
> - 想体验类似于 notion 的 database 的用户（当然差很远的了😄）
>

---

插件的Github链接：[1657744680/obsidian-yaml-database: 像notion database一样浏览编辑文档的YAML属性 (github.com)](https://github.com/1657744680/obsidian-yaml-database)

> （老版本）0.7.0版本的演示视频：[obsidian-yaml-database：帮助您管理一个文件夹中的子文档YAML属性](https://www.bilibili.com/video/BV1M94y1d79D/)
>
> 注意：新版本为了提升体验，**改变了创建代码块的方式**，详见[表格的创建与简介](#表格的创建与简介)

图片预览：

<img src="https://user-images.githubusercontent.com/39726621/162576433-4f8cede1-c487-401c-80e3-46e944f079ee.png" alt="image" width="700px" />



# 安装

1. 手动从[Releases](https://github.com/1657744680/obsidian-yaml-database/releases)页面下载安装
   1. 下载`main.js`、`style.css`、`manifest.json`这3个文件；
   2. 将这3个文件放在`你的库路径/.obsidian/plugins/obsidian-yaml-database`路径下；
   3. 然后关闭第三方插件的`安全模式`，启用本插件。

2. 在obsidian中使用插件[obsidian42-brat: BRAT](https://github.com/TfTHacker/obsidian42-brat)输入`1657744680/obsidian-yaml-database`进行安装。

# 使用

> 注意：**这个表格编辑YAML它是只能编辑一个文件夹下的”子“文档，意思就是这个文件夹的子文件夹下的文档并不会被索引。**

## 代码块：表格编辑YAML

### 表格的创建与简介

> 您只需要按照以下语法创建一个表格，然后就可以进行可视化操作了😄

创建表格的语法：

````text
```yamledit
输入一个id值
```
````

**一个独一无二的`id`对应一个数据表格的配置信息！！**

- 您创建的这个数据表格被渲染后，此表格会被保存到插件的`data.json`中（详见[数据表格配置信息存储（高级）](#数据表格配置信息存储高级)），您在设置面板里可以看到您曾经渲染过哪些数据表格。
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
   1. 新建的未命名文档会被置顶直到其命名被更改

2. `搜索`：会对文件路径及文件的所有yaml属性值进行搜索
3. `编辑列`：点击该按钮后，将鼠标移至表头的某一列并点击右键弹出菜单，操作完成后您可能需要点击`应用变更`来保存更改，现支持以下操作：<img src="https://user-images.githubusercontent.com/39726621/162576693-3a918216-ddbf-48ab-ae02-11be538c70d2.png" alt="image" width="500px" />
   1. `重命名显示名称`：为当前属性命设置显示名称，只是改变其在表格中的显示名称，这不会对属性本身造成影响
   2. `选择属性`：选择当前列要显示的属性
   3. `编辑属性`：您可以在这里看到表格支持的属性类型
      1. 编辑属性的类型、配置、显隐。（操作之后记得点击`应用变更`）
      2. **此外您可以且只能在这里删除该属性**。
   4. `重命名属性`：对当前属性重命名，这个就是对属性本身进行操作了
   5. `隐藏属性`：隐藏当前属性
   6. `添加属性`：现已改到最右侧，点击后会在右边一列添加新属性
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

在`编辑列`未被触发的情况下，点击表头进行排序和过滤操作。

过滤：

<img src="https://user-images.githubusercontent.com/39726621/162576976-02786e3c-bcee-4753-b0bb-d3f77e2b3c09.png" alt="image" width="500px" />

排序：（**多条件排序**：按住`Ctrl`点击表头即可）

<img src="https://user-images.githubusercontent.com/39726621/162577060-bf371025-0c00-4fdf-b7a1-1db35ef772bf.png" alt="image" width="500px" />

### 列宽与拖动

支持直接拖动列排序，也支持拖拽设置列的宽度。

### 支持的属性类型

| 属性                     | 属性配置     | 其它                                                         |
| ------------------------ | ------------ | ------------------------------------------------------------ |
| 文本（text）             |              |                                                              |
| 数字（number）           |              |                                                              |
| 日期（date）             |              |                                                              |
| 时间（time）             |              |                                                              |
| 复选框（checkbox）       |              |                                                              |
| 图片（img）              |              |                                                              |
| 链接（url）              |              |                                                              |
| 标签（tags）             | 可配置候选项 | 可直接在输入框创建候选项<br />仅可在属性配置页面删除、排序候选项 |
| 文本框（textarea）       |              |                                                              |
| 内部链接（inLink）       |              |                                                              |
| 单选（select）           | 可配置候选项 | 可直接在输入框创建候选项<br />仅可在属性配置页面删除、排序候选项 |
| 多选（multiSelect）      | 可配置候选项 | 可直接在输入框创建候选项<br />仅可在属性配置页面删除、排序候选项 |
| 公式（formula）          | 可配置公式   | 仅可在属性配置面板操作<br />仅在表格中显示值，不会更新到文档中 |
| 创建时间（createdTime）  |              | 仅在表格中显示值，不会更新到文档中                           |
| 修改时间（modifiedTime） |              | 仅在表格中显示值，不会更新到文档中                           |

### Formula属性（高级）

> 此功能处于测试期间，若发生错误，请在本插件的`data.json`找到当前表格当前属性对应的`cellEditorParams`，并删除其中的`values`

在`属性配置面板`编辑公式：

1. 使用`prop(属性名)`获取该属性的值。
   **注意这里的`属性名`是属性本身的名称，而不是属性列的显示名称！！**
2. 获取的属性值均为**字符串**
3. 编写js对属性值进行操作
4. 最后使用`return`返回您想显示的值

---

**示例1：**

若属性包含`tag`且值为`test`，则显示true，否则会显示false

```javascript
return prop(tag)=="test"? true:false
```

### 数据表格配置信息存储（高级）

- 所有`id`对应的数据表格的配置信息都存储在插件所在文件夹中的`data.json`中，它包含以下几个参数，在此说明以方便使用：<img src="https://user-images.githubusercontent.com/39726621/162576930-d194f5dd-6418-4b34-a38d-9436696f16f7.png" alt="image" width="300px" />
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

### 配置信息存储位置

可以选择将数据表格的配置信息存储在插件文件夹或者库的某个文件夹中。

### 删除某个id数据表格的配置信息

点击删除将会删除该`id`对应的数据表格的配置信息，**此操作无法撤销**！！

---

# 已知冲突

已知**少部分情况**下和另一个插件banner会有冲突，当在obsidian**外部**操作，并在文档yaml中新建banner属性时，会导致banner插件新建一个yaml，这属于banner的问题，**和本插件无关**😑

---

# 感谢

> 我不太会CSS，早期版本表格样式的代码是QQ群的`Cuman`老哥按我的要求帮忙提供的，感谢！！

> 之前的插件中的表格是纯手写的，在显示多条数据时有很大的性能问题，而且难以实现很多想要实现的复杂功能，于是开始重构代码，参考qq群里`峰华`老哥开发的[windily-cloud/obsidian-AGtable](https://github.com/windily-cloud/obsidian-AGtable)插件使用的[AG Grid](https://www.ag-grid.com/)，目前的表格使用体验比原本要好很多。

---

# 版本更新日志

## 0.8.0

### 增强

- [x] 将数据表格配置信息的导出和导入设置项删除，改成可选择存储在插件文件夹或者是存储到库文件夹下的`YAML Database Config.json`中 #20
- [x] 改善了表格列初始化的解析逻辑 #19
- [x] 编辑列时，添加列的方式改变 #20
  - [x] 点击表格右侧的“+”号添加列
  - [x] 点击添加列不会立即给管理的文档添加列，只有在编辑文档该属性值时会添加或者修改

- [x] 编辑列时，可点击表格右侧的“···”来编辑列
- [x] 新增命令实现自动创建数据表格并生成id #20

## 0.7.10

### 增强

- [x] 设置项里增加多个表格folder设置重复提示
- [x] 设置项里增加导出和导入数据表格信息功能

## 0.7.9

### 修复

- [x] 修复复选框checkbox多列排序问题

## 0.7.8

### 修复

- [x] 修复数字number排序时值不为数字导致排序无效的问题
- [x] 修复复选框checkbox排序问题
- [x] 修复创建时间createdTime排序无效问题
- [x] 修复修改时间modifiedTime排序无效问题

## 0.7.7

### 修复

- [x] 修复数字排序问题 #18

### 增强

- [x] 增加属性：#17
  - [x] 创建时间（createdTime）
  - [x] 修改时间（modifiedTime）

## 0.7.6

### 增强

- [x] 代码部分优化
- [x] 新增属性formula

## 0.7.5

### 修复

- [x] 修复新建属性报错的bug

### 增强

- [x] 新建的未命名文档会被置顶直到其命名被更改

## 0.7.4

### 修复

- [x] 修复inlink编辑器

### 增强

- [x] 居中对齐inlink、tag渲染框 #15
- [x] 增加属性类型：多选（multiSelect）
- [x] 增加属性类型：链接（url）
- [x] 优化单选（select）属性，可直接在输入框中创建候选项

## 0.7.3

### 修复

- [x] 修复文本框换行支持
- [x] 修复移动端插件
- [x] 修复表格设置属性显隐控制未保存的问题

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
